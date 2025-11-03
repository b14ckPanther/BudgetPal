import 'transaction_model.dart';

class TransactionDraft {
  const TransactionDraft({
    this.id,
    required this.categoryId,
    required this.amount,
    required this.transactionDate,
    required this.type,
    this.note,
    this.merchant,
  });

  final String? id;
  final String categoryId;
  final double amount;
  final DateTime transactionDate;
  final TransactionType type;
  final String? note;
  final String? merchant;

  TransactionModel toModel() {
    return TransactionModel(
      id: id ?? '',
      categoryId: categoryId,
      amount: amount,
      transactionDate: transactionDate,
      type: type,
      note: note,
      merchant: merchant,
    );
  }

  TransactionDraft copyWith({
    String? id,
    String? categoryId,
    double? amount,
    DateTime? transactionDate,
    TransactionType? type,
    String? note,
    String? merchant,
  }) {
    return TransactionDraft(
      id: id ?? this.id,
      categoryId: categoryId ?? this.categoryId,
      amount: amount ?? this.amount,
      transactionDate: transactionDate ?? this.transactionDate,
      type: type ?? this.type,
      note: note ?? this.note,
      merchant: merchant ?? this.merchant,
    );
  }

  static TransactionDraft fromModel(TransactionModel model) {
    return TransactionDraft(
      id: model.id,
      categoryId: model.categoryId,
      amount: model.amount,
      transactionDate: model.transactionDate,
      type: model.type,
      note: model.note,
      merchant: model.merchant,
    );
  }
}
