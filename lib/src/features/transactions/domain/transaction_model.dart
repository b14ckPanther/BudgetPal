import 'package:cloud_firestore/cloud_firestore.dart';

enum TransactionType { expense, income }

TransactionType transactionTypeFromString(String value) {
  switch (value) {
    case 'income':
      return TransactionType.income;
    case 'expense':
    default:
      return TransactionType.expense;
  }
}

String transactionTypeToString(TransactionType type) {
  switch (type) {
    case TransactionType.expense:
      return 'expense';
    case TransactionType.income:
      return 'income';
  }
}

class TransactionModel {
  const TransactionModel({
    required this.id,
    required this.categoryId,
    required this.amount,
    required this.transactionDate,
    required this.type,
    this.note,
    this.merchant,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String categoryId;
  final double amount;
  final DateTime transactionDate;
  final TransactionType type;
  final String? note;
  final String? merchant;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  bool get isIncome => type == TransactionType.income;

  TransactionModel copyWith({
    String? id,
    String? categoryId,
    double? amount,
    DateTime? transactionDate,
    TransactionType? type,
    String? note,
    String? merchant,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return TransactionModel(
      id: id ?? this.id,
      categoryId: categoryId ?? this.categoryId,
      amount: amount ?? this.amount,
      transactionDate: transactionDate ?? this.transactionDate,
      type: type ?? this.type,
      note: note ?? this.note,
      merchant: merchant ?? this.merchant,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'categoryId': categoryId,
      'amount': amount,
      'transactionDate': Timestamp.fromDate(transactionDate),
      'type': transactionTypeToString(type),
      'note': note,
      'merchant': merchant,
    };
  }

  factory TransactionModel.fromSnapshot(
    DocumentSnapshot<Map<String, dynamic>> snapshot,
  ) {
    final data = snapshot.data() ?? <String, dynamic>{};
    return TransactionModel(
      id: snapshot.id,
      categoryId: data['categoryId'] as String? ?? '',
      amount: (data['amount'] as num?)?.toDouble() ?? 0,
      transactionDate: _asDateTime(data['transactionDate']) ?? DateTime.now(),
      type: transactionTypeFromString(data['type'] as String? ?? 'expense'),
      note: data['note'] as String?,
      merchant: data['merchant'] as String?,
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
