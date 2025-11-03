import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import 'package:budgetpal/l10n/app_localizations.dart';

import '../../../core/formatters/app_currency_formatter.dart';
import '../../../core/widgets/app_error_view.dart';
import '../../../core/widgets/app_progress_indicator.dart';
import '../../budget/application/budget_providers.dart';
import '../../categories/domain/budget_category.dart';
import '../../transactions/application/transactions_providers.dart';
import '../../transactions/domain/transaction_model.dart';

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
    final theme = Theme.of(context);
    final locale = Localizations.localeOf(context);
    final categoryById = _buildCategoryMap(overview);
    final recentTransactions = transactions.take(5).toList(growable: false);

    return RefreshIndicator.adaptive(
      onRefresh: onRefresh,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.homeOverviewTitle,
              style: theme.textTheme.headlineMedium,
            ),
            const SizedBox(height: 12),
            Text(
              l10n.homeOverviewSubtitle,
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                _SummaryCard(
                  title: l10n.budgetTotalsIncomeReceived,
                  value: AppCurrencyFormatter.format(
                    overview.totalIncomeReceived,
                    locale: locale,
                  ),
                  icon: Icons.trending_up,
                  color: theme.colorScheme.primary,
                ),
                _SummaryCard(
                  title: l10n.budgetTotalsSpent,
                  value: AppCurrencyFormatter.format(
                    overview.totalExpenseSpent,
                    locale: locale,
                  ),
                  icon: Icons.payments_outlined,
                  color: theme.colorScheme.error,
                ),
                _SummaryCard(
                  title: l10n.budgetTotalsAvailable,
                  value: AppCurrencyFormatter.format(
                    overview.availableToBudget,
                    locale: locale,
                  ),
                  icon: Icons.account_balance_wallet_outlined,
                  color: theme.colorScheme.tertiary,
                  highlight: overview.availableToBudget < 0,
                ),
              ],
            ),
            const SizedBox(height: 24),
            _SpendingBreakdownSection(
              overview: overview,
              l10n: l10n,
            ),
            const SizedBox(height: 24),
            _RecentTransactionsSection(
              l10n: l10n,
              transactions: recentTransactions,
              categoryById: categoryById,
              locale: locale,
            ),
          ],
        ),
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

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.highlight = false,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: 320,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      value,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: highlight ? theme.colorScheme.error : null,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SpendingBreakdownSection extends StatelessWidget {
  const _SpendingBreakdownSection({
    required this.overview,
    required this.l10n,
  });

  final BudgetOverview overview;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final locale = Localizations.localeOf(context);

    final groups = overview.expenseGroups;

    if (groups.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text(
            l10n.transactionsEmptySubtitle,
            style: theme.textTheme.bodyMedium,
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.budgetTitle,
              style: theme.textTheme.titleLarge,
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
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 8,
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
                          AppCurrencyFormatter.format(
                            target,
                            locale: locale,
                          ),
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
                          AppCurrencyFormatter.format(
                            remaining,
                            locale: locale,
                          ),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: remaining < 0
                                ? theme.colorScheme.error
                                : null,
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
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text(
            l10n.transactionsEmptySubtitle,
            style: theme.textTheme.bodyMedium,
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.transactionsTitle,
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            ...transactions.map((transaction) {
              final category = categoryById[transaction.categoryId];
              final amount = AppCurrencyFormatter.format(
                transaction.amount,
                locale: locale,
              );
              final isIncome = transaction.isIncome;
              final formattedDate = DateFormat.yMMMd(locale.toLanguageTag())
                  .format(transaction.transactionDate);
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
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
                  transaction.merchant ?? category?.name ?? l10n.navTransactions,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text('$formattedDate • ${category?.name ?? l10n.navTransactions}'),
                trailing: Text(
                  isIncome ? '+$amount' : '-$amount',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: isIncome
                        ? theme.colorScheme.primary
                        : theme.colorScheme.error,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
