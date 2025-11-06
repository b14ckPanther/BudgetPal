import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:budgetpal/l10n/app_localizations.dart';

import '../../../core/formatters/app_currency_formatter.dart';
import '../../../core/widgets/app_error_view.dart';
import '../../../core/widgets/app_progress_indicator.dart';
import '../../../core/widgets/glass_backdrop.dart';
import '../../../core/widgets/glass_panel.dart';
import '../../categories/application/category_controller.dart';
import '../../categories/domain/budget_category.dart';
import '../../categories/domain/budget_category_draft.dart';
import '../application/budget_providers.dart';
import '../../transactions/application/transactions_providers.dart';
import '../presentation/widgets/budget_section.dart';
import '../presentation/widgets/category_form_sheet.dart';

String _shortText(String text, {int maxWords = 4}) {
  final words = text
      .trim()
      .split(RegExp(r'\s+'))
      .where((word) => word.isNotEmpty);
  final truncated = words.take(maxWords).join(' ');
  return truncated.isEmpty ? text : truncated;
}

class BudgetScreen extends ConsumerStatefulWidget {
  const BudgetScreen({super.key});

  @override
  ConsumerState<BudgetScreen> createState() => _BudgetScreenState();
}

class _BudgetScreenState extends ConsumerState<BudgetScreen> {
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final overviewAsync = ref.watch(budgetOverviewProvider);
    final categoriesAsync = ref.watch(categoriesStreamProvider);

    if (overviewAsync.isLoading || categoriesAsync.isLoading) {
      return AppProgressIndicator(label: l10n.loadingLabel);
    }

    final overviewError = overviewAsync.hasError ? overviewAsync.error : null;
    if (overviewError != null) {
      return AppErrorView(
        title: l10n.unknownError,
        message: l10n.genericLoadError,
        details: overviewError.toString(),
        retryLabel: l10n.retryButtonLabel,
        onRetry: () => ref.invalidate(budgetOverviewProvider),
      );
    }

    final categoriesError = categoriesAsync.hasError
        ? categoriesAsync.error
        : null;
    if (categoriesError != null) {
      return AppErrorView(
        title: l10n.unknownError,
        message: l10n.genericLoadError,
        details: categoriesError.toString(),
        retryLabel: l10n.retryButtonLabel,
        onRetry: () => ref.invalidate(categoriesStreamProvider),
      );
    }

    final overview = overviewAsync.valueOrNull;

    if (overview == null) {
      return AppErrorView(
        title: l10n.unknownError,
        message: l10n.genericLoadError,
        retryLabel: l10n.retryButtonLabel,
        onRetry: () => ref.invalidate(budgetOverviewProvider),
      );
    }

    final labels = BudgetSectionLabels(
      budgeted: l10n.budgetTotalsBudgeted,
      spent: l10n.budgetTotalsSpent,
      incomeReceived: l10n.budgetTotalsIncomeReceived,
      incomeRemaining: l10n.budgetTotalsAvailable,
      expenseRemaining: l10n.budgetTotalsAvailable,
      edit: l10n.budgetEditCategory,
      delete: l10n.budgetCategoryDelete,
    );
    String categoryLabel(CategoryType type) {
      switch (type) {
        case CategoryType.need:
          return l10n.budgetNeedsHeading;
        case CategoryType.want:
          return l10n.budgetWantsHeading;
        case CategoryType.loan:
          return l10n.budgetLoansHeading;
        case CategoryType.income:
          return l10n.budgetIncomeHeading;
      }
    }

    final hasEnvelopes =
        overview.incomeGroup.envelopes.isNotEmpty ||
        overview.expenseGroups.any((group) => group.envelopes.isNotEmpty);

    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          const AnimatedGlassBackdrop(),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _BudgetHeader(
                    l10n: l10n,
                    overview: overview,
                    onAddCategory: () => _showAddCategory(),
                    hasEnvelopes: hasEnvelopes,
                  ),
                  const SizedBox(height: 20),
                  Expanded(
                    child: _BudgetContent(
                      overview: overview,
                      labels: labels,
                      categoryLabelResolver: categoryLabel,
                      hasEnvelopes: hasEnvelopes,
                      onAddCategory: () => _showAddCategory(),
                      onEdit: (envelope) =>
                          _showEditCategory(envelope.category),
                      onDelete: (envelope) => _confirmDelete(envelope.category),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showAddCategory() {
    return showCategoryFormSheet(context, ref);
  }

  Future<void> _showEditCategory(BudgetCategory category) {
    return showCategoryFormSheet(
      context,
      ref,
      draft: BudgetCategoryDraft.fromCategory(category),
    );
  }

  Future<void> _confirmDelete(BudgetCategory category) async {
    final l10n = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.budgetCategoryDeleteConfirmTitle),
        content: Text(l10n.budgetCategoryDeleteConfirmMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(l10n.budgetCategoryDeleteConfirmCancel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(l10n.budgetCategoryDeleteConfirmConfirm),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref
          .read(categoryControllerProvider.notifier)
          .deleteCategory(category.id, type: category.type);
    }
  }
}

class _SummaryMetric extends StatelessWidget {
  const _SummaryMetric({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  final String label;
  final double value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final locale = Localizations.localeOf(context);
    final formattedValue = AppCurrencyFormatter.format(value, locale: locale);
    final colorScheme = theme.colorScheme;
    final gradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        colorScheme.primary.withValues(alpha: 0.14),
        colorScheme.surface.withValues(alpha: 0.08),
      ],
    );

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.9, end: 1),
      duration: const Duration(milliseconds: 420),
      curve: Curves.easeOutBack,
      builder: (context, scale, child) =>
          Transform.scale(scale: scale, child: child),
      child: Container(
        width: 220,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(gradient: gradient),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              formattedValue,
              style: theme.textTheme.titleMedium?.copyWith(
                color: highlight ? colorScheme.error : colorScheme.onSurface,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BudgetHeader extends StatelessWidget {
  const _BudgetHeader({
    required this.l10n,
    required this.overview,
    required this.onAddCategory,
    required this.hasEnvelopes,
  });

  final AppLocalizations l10n;
  final BudgetOverview overview;
  final VoidCallback onAddCategory;
  final bool hasEnvelopes;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final metrics = [
      _SummaryMetric(
        label: l10n.budgetTotalsIncomeReceived,
        value: overview.totalIncomeReceived,
      ),
      _SummaryMetric(
        label: l10n.budgetTotalsBudgeted,
        value: overview.totalExpenseBudget,
      ),
      _SummaryMetric(
        label: l10n.budgetTotalsSpent,
        value: overview.totalExpenseSpent,
      ),
      _SummaryMetric(
        label: l10n.budgetTotalsAvailable,
        value: overview.availableToBudget,
        highlight: overview.availableToBudget < 0,
      ),
    ];

    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.budgetTitle,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _shortText(l10n.budgetSubtitle),
                      style: theme.textTheme.bodyLarge,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              FilledButton.icon(
                onPressed: onAddCategory,
                icon: const Icon(Icons.add),
                label: Text(l10n.budgetAddCategory),
              ),
            ],
          ),
          const SizedBox(height: 20),
          AnimatedOpacity(
            duration: const Duration(milliseconds: 250),
            opacity: hasEnvelopes ? 1 : 0.7,
            child: Wrap(spacing: 16, runSpacing: 16, children: metrics),
          ),
        ],
      ),
    );
  }
}

class _BudgetContent extends StatelessWidget {
  const _BudgetContent({
    required this.overview,
    required this.labels,
    required this.categoryLabelResolver,
    required this.hasEnvelopes,
    required this.onAddCategory,
    required this.onEdit,
    required this.onDelete,
  });

  final BudgetOverview overview;
  final BudgetSectionLabels labels;
  final String Function(CategoryType type) categoryLabelResolver;
  final bool hasEnvelopes;
  final VoidCallback onAddCategory;
  final void Function(BudgetEnvelope envelope) onEdit;
  final void Function(BudgetEnvelope envelope) onDelete;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final sections = <Widget>[
      if (overview.incomeGroup.envelopes.isNotEmpty)
        Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: BudgetSection(
            group: overview.incomeGroup,
            sectionLabel: l10n.budgetIncomeHeading,
            categoryLabelResolver: categoryLabelResolver,
            labels: labels,
            onEdit: onEdit,
            onDelete: onDelete,
          ),
        ),
      ...overview.expenseGroups.map(
        (group) => Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: BudgetSection(
            group: group,
            sectionLabel: categoryLabelResolver(group.type),
            categoryLabelResolver: categoryLabelResolver,
            labels: labels,
            onEdit: onEdit,
            onDelete: onDelete,
          ),
        ),
      ),
    ];

    return GlassPanel(
      padding: EdgeInsets.zero,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        child: hasEnvelopes
            ? ListView(
                key: const ValueKey('budget_sections'),
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
                children: sections,
              )
            : _BudgetEmptyView(
                key: const ValueKey('budget_empty'),
                onAddCategory: onAddCategory,
              ),
      ),
    );
  }
}

class _BudgetEmptyView extends StatelessWidget {
  const _BudgetEmptyView({super.key, required this.onAddCategory});

  final VoidCallback onAddCategory;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _shortText(l10n.budgetNoCategoriesTitle),
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              _shortText(l10n.budgetNoCategoriesSubtitle),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: onAddCategory,
              child: Text(l10n.budgetAddCategory),
            ),
          ],
        ),
      ),
    );
  }
}
