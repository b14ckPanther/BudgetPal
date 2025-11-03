import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../categories/domain/budget_category.dart';
import '../../transactions/application/transactions_providers.dart';
import '../../transactions/domain/transaction_model.dart';

class BudgetEnvelope {
  const BudgetEnvelope({
    required this.category,
    required this.spentAmount,
  });

  final BudgetCategory category;
  final double spentAmount;

  double get targetAmount => category.targetAmount;

  double get remaining => targetAmount - spentAmount;

  double get progress {
    if (targetAmount <= 0) {
      return 0;
    }
    return (spentAmount / targetAmount).clamp(0, 1);
  }

  bool get isOverspent => remaining < 0 && !category.isIncome;
}

class BudgetGroup {
  const BudgetGroup({
    required this.type,
    required this.label,
    required this.envelopes,
  });

  final CategoryType type;
  final String label;
  final List<BudgetEnvelope> envelopes;

  double get totalTarget =>
      envelopes.fold(0, (prev, env) => prev + env.targetAmount);

  double get totalSpent =>
      envelopes.fold(0, (prev, env) => prev + env.spentAmount);

  double get totalRemaining => totalTarget - totalSpent;
}

class BudgetOverview {
  const BudgetOverview({
    required this.incomeGroup,
    required this.expenseGroups,
  });

  final BudgetGroup incomeGroup;
  final List<BudgetGroup> expenseGroups;

  double get totalIncomeTarget => incomeGroup.totalTarget;
  double get totalIncomeReceived => incomeGroup.totalSpent;

  double get totalExpenseBudget =>
      expenseGroups.fold(0, (prev, group) => prev + group.totalTarget);

  double get totalExpenseSpent =>
      expenseGroups.fold(0, (prev, group) => prev + group.totalSpent);

  double get availableToBudget =>
      totalIncomeReceived - totalExpenseSpent;
}

final budgetOverviewProvider =
    Provider.autoDispose<AsyncValue<BudgetOverview>>((ref) {
  final categoriesAsync = ref.watch(categoriesStreamProvider);
  final transactionsAsync = ref.watch(transactionsStreamProvider);

  return categoriesAsync.when(
    data: (categories) => transactionsAsync.when(
      data: (transactions) {
        return AsyncValue.data(
          _buildOverview(categories, transactions),
        );
      },
      loading: () => const AsyncValue.loading(),
      error: (error, stackTrace) => AsyncValue.error(error, stackTrace),
    ),
    loading: () => const AsyncValue.loading(),
    error: (error, stackTrace) => AsyncValue.error(error, stackTrace),
  );
});

BudgetOverview _buildOverview(
  List<BudgetCategory> categories,
  List<TransactionModel> transactions,
) {
  final incomeCategories =
      categories.where((category) => category.isIncome).toList();
  final expenseCategories = categories
      .where((category) => !category.isIncome)
      .toList(growable: false);

  double sumCategoryTransactions(
    String categoryId,
    TransactionType type,
  ) {
    return transactions
        .where(
          (transaction) =>
              transaction.categoryId == categoryId &&
              transaction.type == type,
        )
        .fold(0.0, (prev, transaction) => prev + transaction.amount);
  }

  BudgetEnvelope envelopeForCategory(BudgetCategory category) {
    final type =
        category.isIncome ? TransactionType.income : TransactionType.expense;
    final spent = sumCategoryTransactions(category.id, type);
    return BudgetEnvelope(category: category, spentAmount: spent);
  }

  final incomeEnvelopes =
      incomeCategories.map(envelopeForCategory).toList(growable: false);

  List<BudgetGroup> buildExpenseGroups() {
    final groups = <CategoryType, List<BudgetEnvelope>>{};
    for (final category in expenseCategories) {
      groups.putIfAbsent(category.type, () => []);
      groups[category.type]!.add(envelopeForCategory(category));
    }

    String labelForType(CategoryType type) {
      switch (type) {
        case CategoryType.need:
          return 'needs';
        case CategoryType.want:
          return 'wants';
        case CategoryType.loan:
          return 'loans';
        case CategoryType.income:
          return 'income';
      }
    }

    return groups.entries
        .map(
          (entry) => BudgetGroup(
            type: entry.key,
            label: labelForType(entry.key),
            envelopes: entry.value,
          ),
        )
        .toList(growable: false)
      ..sort((a, b) => a.type.index.compareTo(b.type.index));
  }

  final incomeGroup = BudgetGroup(
    type: CategoryType.income,
    label: 'income',
    envelopes: incomeEnvelopes,
  );

  return BudgetOverview(
    incomeGroup: incomeGroup,
    expenseGroups: buildExpenseGroups(),
  );
}
