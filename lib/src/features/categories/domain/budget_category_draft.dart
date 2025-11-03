import 'budget_category.dart';

class BudgetCategoryDraft {
  const BudgetCategoryDraft({
    this.id,
    required this.name,
    required this.type,
    required this.targetAmount,
  });

  final String? id;
  final String name;
  final CategoryType type;
  final double targetAmount;

  BudgetCategoryDraft copyWith({
    String? id,
    String? name,
    CategoryType? type,
    double? targetAmount,
  }) {
    return BudgetCategoryDraft(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      targetAmount: targetAmount ?? this.targetAmount,
    );
  }

  factory BudgetCategoryDraft.fromCategory(BudgetCategory category) {
    return BudgetCategoryDraft(
      id: category.id,
      name: category.name,
      type: category.type,
      targetAmount: category.targetAmount,
    );
  }
}
