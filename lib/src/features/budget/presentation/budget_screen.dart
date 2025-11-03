import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:budgetpal/l10n/app_localizations.dart';

import '../../../core/formatters/app_currency_formatter.dart';
import '../../../core/widgets/app_error_view.dart';
import '../../../core/widgets/app_progress_indicator.dart';
import '../../categories/application/category_controller.dart';
import '../../categories/domain/budget_category.dart';
import '../../categories/domain/budget_category_draft.dart';
import '../application/budget_providers.dart';
import '../../transactions/application/transactions_providers.dart';
import '../presentation/widgets/budget_section.dart';
import '../presentation/widgets/category_form_sheet.dart';

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

    final categoriesError =
        categoriesAsync.hasError ? categoriesAsync.error : null;
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
    final categories = categoriesAsync.valueOrNull ?? <BudgetCategory>[];

    if (overview == null) {
      return AppErrorView(
        title: l10n.unknownError,
        message: l10n.genericLoadError,
        retryLabel: l10n.retryButtonLabel,
        onRetry: () => ref.invalidate(budgetOverviewProvider),
      );
    }

    if (categories.isEmpty) {
      return _EmptyBudgetState(onAddCategory: _showAddCategory);
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

    return Padding(
      padding: const EdgeInsets.all(24),
      child: ListView(
        children: [
          _BudgetSummary(overview: overview, l10n: l10n),
          const SizedBox(height: 24),
          Align(
            alignment: Alignment.centerLeft,
            child: FilledButton.icon(
              onPressed: _showAddCategory,
              icon: const Icon(Icons.add),
              label: Text(l10n.budgetAddCategory),
            ),
          ),
          const SizedBox(height: 24),
          if (overview.incomeGroup.envelopes.isNotEmpty) ...[
            BudgetSection(
              group: overview.incomeGroup,
              sectionLabel: l10n.budgetIncomeHeading,
              categoryLabelResolver: categoryLabel,
              labels: labels,
              onEdit: (envelope) => _showEditCategory(envelope.category),
              onDelete: (envelope) => _confirmDelete(envelope.category),
            ),
            const SizedBox(height: 24),
          ],
          ...overview.expenseGroups.map(
            (group) => Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: BudgetSection(
                group: group,
                sectionLabel: categoryLabel(group.type),
                categoryLabelResolver: categoryLabel,
                labels: labels,
                onEdit: (envelope) => _showEditCategory(envelope.category),
                onDelete: (envelope) => _confirmDelete(envelope.category),
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

class _BudgetSummary extends StatelessWidget {
  const _BudgetSummary({
    required this.overview,
    required this.l10n,
  });

  final BudgetOverview overview;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.budgetTitle,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 24,
              runSpacing: 16,
              children: [
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
              ],
            ),
          ],
        ),
      ),
    );
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
    final formattedValue =
        AppCurrencyFormatter.format(value, locale: locale);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          formattedValue,
          style: theme.textTheme.titleMedium?.copyWith(
            color: highlight ? theme.colorScheme.error : null,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _EmptyBudgetState extends StatelessWidget {
  const _EmptyBudgetState({required this.onAddCategory});

  final VoidCallback onAddCategory;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              l10n.budgetNoCategoriesTitle,
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: 320,
              child: Text(
                l10n.budgetNoCategoriesSubtitle,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
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
