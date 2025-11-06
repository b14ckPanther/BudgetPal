import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import 'package:budgetpal/l10n/app_localizations.dart';

import '../../../core/formatters/app_currency_formatter.dart';
import '../../../core/widgets/app_error_view.dart';
import '../../../core/widgets/app_progress_indicator.dart';
import '../../../core/widgets/glass_backdrop.dart';
import '../../../core/widgets/glass_panel.dart';
import '../../budget/application/budget_providers.dart';
import '../../categories/domain/budget_category.dart';
import '../../transactions/application/transactions_providers.dart';
import '../../transactions/domain/transaction_model.dart';

String _shortText(String text, {int maxWords = 4}) {
  final words = text
      .trim()
      .split(RegExp(r'\s+'))
      .where((word) => word.isNotEmpty);
  final truncated = words.take(maxWords).join(' ');
  return truncated.isEmpty ? text : truncated;
}

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final overviewAsync = ref.watch(budgetOverviewProvider);
    final transactionsAsync = ref.watch(transactionsStreamProvider);

    return overviewAsync.when(
      data: (overviewValue) => transactionsAsync.when(
        data: (transactions) => _DashboardView(
          overview: overviewValue,
          transactions: transactions,
          l10n: l10n,
          onRefresh: () async {
            ref.invalidate(budgetOverviewProvider);
            ref.invalidate(transactionsStreamProvider);
            await Future<void>.delayed(const Duration(milliseconds: 200));
          },
        ),
        loading: () => const AppProgressIndicator(),
        error: (error, stack) => AppErrorView(
          title: l10n.unknownError,
          message: l10n.genericLoadError,
          details: error.toString(),
          retryLabel: l10n.retryButtonLabel,
          onRetry: () => ref.invalidate(transactionsStreamProvider),
        ),
      ),
      loading: () => const AppProgressIndicator(),
      error: (error, stack) => AppErrorView(
        title: l10n.unknownError,
        message: l10n.genericLoadError,
        details: error.toString(),
        retryLabel: l10n.retryButtonLabel,
        onRetry: () => ref.invalidate(budgetOverviewProvider),
      ),
    );
  }
}

class _DashboardView extends StatelessWidget {
  const _DashboardView({
    required this.overview,
    required this.transactions,
    required this.l10n,
    required this.onRefresh,
  });

  final BudgetOverview overview;
  final List<TransactionModel> transactions;
  final AppLocalizations l10n;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final categoryById = _buildCategoryMap(overview);
    final recentTransactions = transactions.take(5).toList(growable: false);

    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          const AnimatedGlassBackdrop(),
          RefreshIndicator.adaptive(
            onRefresh: onRefresh,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    _HomeHeader(l10n: l10n, overview: overview, locale: locale),
                    const SizedBox(height: 20),
                    _SpendingBreakdownSection(
                      overview: overview,
                      l10n: l10n,
                      locale: locale,
                    ),
                    const SizedBox(height: 20),
                    _RecentTransactionsSection(
                      l10n: l10n,
                      transactions: recentTransactions,
                      categoryById: categoryById,
                      locale: locale,
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Map<String, BudgetCategory> _buildCategoryMap(BudgetOverview overview) {
    final map = <String, BudgetCategory>{};
    for (final envelope in overview.incomeGroup.envelopes) {
      map[envelope.category.id] = envelope.category;
    }
    for (final group in overview.expenseGroups) {
      for (final envelope in group.envelopes) {
        map[envelope.category.id] = envelope.category;
      }
    }
    return map;
  }
}

class _HomeHeader extends StatelessWidget {
  const _HomeHeader({
    required this.l10n,
    required this.overview,
    required this.locale,
  });

  final AppLocalizations l10n;
  final BudgetOverview overview;
  final Locale locale;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final stats = [
      _SummaryStat(
        icon: Icons.trending_up,
        color: theme.colorScheme.primary,
        label: l10n.budgetTotalsIncomeReceived,
        value: AppCurrencyFormatter.format(
          overview.totalIncomeReceived,
          locale: locale,
        ),
      ),
      _SummaryStat(
        icon: Icons.payments_outlined,
        color: theme.colorScheme.error,
        label: l10n.budgetTotalsSpent,
        value: AppCurrencyFormatter.format(
          overview.totalExpenseSpent,
          locale: locale,
        ),
      ),
      _SummaryStat(
        icon: Icons.account_balance_wallet_outlined,
        color: theme.colorScheme.tertiary,
        label: l10n.budgetTotalsAvailable,
        value: AppCurrencyFormatter.format(
          overview.availableToBudget,
          locale: locale,
        ),
        highlight: overview.availableToBudget < 0,
      ),
    ];

    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.homeOverviewTitle,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _shortText(l10n.homeOverviewSubtitle),
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 20),
          Wrap(spacing: 16, runSpacing: 16, children: stats),
        ],
      ),
    );
  }
}

class _SummaryStat extends StatelessWidget {
  const _SummaryStat({
    required this.icon,
    required this.color,
    required this.label,
    required this.value,
    this.highlight = false,
  });

  final IconData icon;
  final Color color;
  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final baseColor = color.withValues(alpha: isDark ? 0.22 : 0.12);
    final accentColor = theme.colorScheme.surface.withValues(
      alpha: isDark ? 0.18 : 0.06,
    );

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOutCubic,
      width: 240,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [baseColor, accentColor],
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.12)),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: highlight ? theme.colorScheme.error : null,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SpendingBreakdownSection extends StatelessWidget {
  const _SpendingBreakdownSection({
    required this.overview,
    required this.l10n,
    required this.locale,
  });

  final BudgetOverview overview;
  final AppLocalizations l10n;
  final Locale locale;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final groups = overview.expenseGroups;

    if (groups.isEmpty) {
      return GlassPanel(
        child: Text(
          _shortText(l10n.transactionsEmptySubtitle),
          style: theme.textTheme.bodyMedium,
        ),
      );
    }

    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.budgetTitle,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          ...groups.map((group) {
            final spent = group.totalSpent;
            final target = group.totalTarget;
            final remaining = target - spent;
            final progress = target <= 0
                ? 0.0
                : (spent / target).clamp(0.0, 1.0).toDouble();
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _labelForGroup(group.type, l10n),
                        style: theme.textTheme.titleMedium,
                      ),
                      Text(
                        AppCurrencyFormatter.format(spent, locale: locale),
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRect(
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 10,
                      backgroundColor: theme.colorScheme.surfaceContainerHighest
                          .withValues(alpha: 0.4),
                      valueColor: AlwaysStoppedAnimation(
                        theme.colorScheme.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.budgetTotalsBudgeted,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      Text(
                        AppCurrencyFormatter.format(target, locale: locale),
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.budgetTotalsAvailable,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      Text(
                        AppCurrencyFormatter.format(remaining, locale: locale),
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: remaining < 0
                              ? theme.colorScheme.error
                              : theme.colorScheme.onSurface,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  String _labelForGroup(CategoryType type, AppLocalizations l10n) {
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
}

class _RecentTransactionsSection extends StatelessWidget {
  const _RecentTransactionsSection({
    required this.l10n,
    required this.transactions,
    required this.categoryById,
    required this.locale,
  });

  final AppLocalizations l10n;
  final List<TransactionModel> transactions;
  final Map<String, BudgetCategory> categoryById;
  final Locale locale;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (transactions.isEmpty) {
      return GlassPanel(
        child: Text(
          _shortText(l10n.transactionsEmptySubtitle),
          style: theme.textTheme.bodyMedium,
        ),
      );
    }

    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.transactionsTitle,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 16),
          ...transactions.map((transaction) {
            final category = categoryById[transaction.categoryId];
            final amount = AppCurrencyFormatter.format(
              transaction.amount,
              locale: locale,
            );
            final isIncome = transaction.isIncome;
            final formattedDate = DateFormat.yMMMd(
              locale.toLanguageTag(),
            ).format(transaction.transactionDate);
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  radius: 24,
                  backgroundColor: isIncome
                      ? theme.colorScheme.primary.withValues(alpha: 0.12)
                      : theme.colorScheme.error.withValues(alpha: 0.12),
                  child: Icon(
                    isIncome ? Icons.south_west : Icons.north_east,
                    color: isIncome
                        ? theme.colorScheme.primary
                        : theme.colorScheme.error,
                  ),
                ),
                title: Text(
                  transaction.merchant ??
                      category?.name ??
                      l10n.navTransactions,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  '$formattedDate • ${category?.name ?? l10n.navTransactions}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: Text(
                  isIncome ? '+$amount' : '-$amount',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: isIncome
                        ? theme.colorScheme.primary
                        : theme.colorScheme.error,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
