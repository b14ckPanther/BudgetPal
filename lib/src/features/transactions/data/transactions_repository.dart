import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/firebase_paths.dart';
import '../../../core/firebase/firebase_providers.dart';
import '../domain/transaction_model.dart';

final transactionsRepositoryProvider = Provider<TransactionsRepository>((ref) {
  final firestore = ref.watch(firebaseFirestoreProvider);
  return TransactionsRepository(firestore);
});

class TransactionsRepository {
  TransactionsRepository(this._firestore);

  final FirebaseFirestore _firestore;

  Stream<List<TransactionModel>> watchTransactions(String uid) {
    final collection = _firestore
        .collection(userTransactionsCollectionPath(uid))
        .orderBy('transactionDate', descending: true);

    return collection.snapshots().map(
      (snapshot) => snapshot.docs
          .map(TransactionModel.fromSnapshot)
          .toList(growable: false),
    );
  }

  Future<List<TransactionModel>> fetchTransactions(String uid) async {
    final snapshot = await _firestore
        .collection(userTransactionsCollectionPath(uid))
        .orderBy('transactionDate', descending: true)
        .get();

    return snapshot.docs
        .map(TransactionModel.fromSnapshot)
        .toList(growable: false);
  }

  Future<TransactionModel> addTransaction({
    required String uid,
    required TransactionModel transaction,
  }) async {
    final collection = _firestore.collection(
      userTransactionsCollectionPath(uid),
    );
    final docRef = transaction.id.isNotEmpty
        ? collection.doc(transaction.id)
        : collection.doc();

    final payload = Map<String, dynamic>.from(transaction.toJson())
      ..addAll({
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

    await docRef.set(payload);

    final snapshot = await docRef.get();
    return TransactionModel.fromSnapshot(snapshot);
  }

  Future<void> updateTransaction({
    required String uid,
    required TransactionModel transaction,
  }) async {
    final docRef = _firestore.doc(
      userTransactionDocumentPath(uid, transaction.id),
    );
    final payload = Map<String, dynamic>.from(transaction.toJson())
      ..addAll({'updatedAt': FieldValue.serverTimestamp()});
    await docRef.update(payload);
  }

  Future<void> deleteTransaction({
    required String uid,
    required String transactionId,
  }) async {
    final docRef = _firestore.doc(
      userTransactionDocumentPath(uid, transactionId),
    );
    await docRef.delete();
  }
}
