import 'package:cloud_firestore/cloud_firestore.dart';

enum CategoryType {
  need,
  want,
  loan,
  income,
}

CategoryType categoryTypeFromString(String value) {
  switch (value) {
    case 'need':
      return CategoryType.need;
    case 'want':
      return CategoryType.want;
    case 'loan':
      return CategoryType.loan;
    case 'income':
      return CategoryType.income;
    default:
      return CategoryType.need;
  }
}

String categoryTypeToString(CategoryType type) {
  switch (type) {
    case CategoryType.need:
      return 'need';
    case CategoryType.want:
      return 'want';
    case CategoryType.loan:
      return 'loan';
    case CategoryType.income:
      return 'income';
  }
}

class BudgetCategory {
  const BudgetCategory({
    required this.id,
    required this.name,
    required this.type,
    required this.targetAmount,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final CategoryType type;
  final double targetAmount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  bool get isLoan => type == CategoryType.loan;
  bool get isIncome => type == CategoryType.income;

  BudgetCategory copyWith({
    String? id,
    String? name,
    CategoryType? type,
    double? targetAmount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return BudgetCategory(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      targetAmount: targetAmount ?? this.targetAmount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': categoryTypeToString(type),
      'targetAmount': targetAmount,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  factory BudgetCategory.fromSnapshot(
    DocumentSnapshot<Map<String, dynamic>> snapshot,
  ) {
    final data = snapshot.data() ?? <String, dynamic>{};
    return BudgetCategory(
      id: snapshot.id,
      name: data['name'] as String? ?? 'Uncategorized',
      type: categoryTypeFromString(data['type'] as String? ?? 'need'),
      targetAmount: (data['targetAmount'] as num?)?.toDouble() ?? 0,
      createdAt: _asDateTime(data['createdAt']),
      updatedAt: _asDateTime(data['updatedAt']),
    );
  }
}

DateTime? _asDateTime(dynamic value) {
  if (value is Timestamp) {
    return value.toDate();
  }
  if (value is DateTime) {
    return value;
  }
  return null;
}
