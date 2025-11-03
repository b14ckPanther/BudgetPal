import 'transaction_model.dart';
import 'transaction_draft.dart';

class AiTransactionSuggestion {
  const AiTransactionSuggestion({
    required this.amount,
    required this.categoryId,
    required this.type,
    required this.transactionDate,
    this.merchant,
    this.note,
  });

  final double amount;
  final String categoryId;
  final TransactionType type;
  final DateTime transactionDate;
  final String? merchant;
  final String? note;

  Map<String, dynamic> toJson() {
    return {
      'amount': amount,
      'categoryId': categoryId,
      'type': transactionTypeToString(type),
      'transactionDate': transactionDate.toUtc().toIso8601String(),
      'merchant': merchant,
      'note': note,
    };
  }

  AiTransactionSuggestion copyWith({
    double? amount,
    String? categoryId,
    TransactionType? type,
    DateTime? transactionDate,
    String? merchant,
    String? note,
  }) {
    return AiTransactionSuggestion(
      amount: amount ?? this.amount,
      categoryId: categoryId ?? this.categoryId,
      type: type ?? this.type,
      transactionDate: transactionDate ?? this.transactionDate,
      merchant: merchant ?? this.merchant,
      note: note ?? this.note,
    );
  }

  TransactionDraft toDraft() {
    return TransactionDraft(
      categoryId: categoryId,
      amount: amount,
      transactionDate: transactionDate,
      type: type,
      merchant: merchant,
      note: note,
    );
  }

  static AiTransactionSuggestion fromJson(Map<String, dynamic> json) {
    final type = transactionTypeFromString(
      json['type'] as String? ?? 'expense',
    );
    return AiTransactionSuggestion(
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      categoryId: json['categoryId'] as String? ?? '',
      type: type,
      transactionDate:
          DateTime.tryParse(json['transactionDate'] as String? ?? '') ??
          DateTime.now(),
      merchant: json['merchant'] as String?,
      note: json['note'] as String?,
    );
  }
}
