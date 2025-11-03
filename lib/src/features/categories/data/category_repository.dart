import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/firebase_paths.dart';
import '../../../core/firebase/firebase_providers.dart';
import '../domain/budget_category.dart';

final categoryRepositoryProvider = Provider<CategoryRepository>((ref) {
  final firestore = ref.watch(firebaseFirestoreProvider);
  return CategoryRepository(firestore);
});

class CategoryRepository {
  CategoryRepository(this._firestore);

  final FirebaseFirestore _firestore;

  Stream<List<BudgetCategory>> watchCategories(String uid) {
    final query = _firestore
        .collection(userCategoriesCollectionPath(uid))
        .orderBy('name');
    return query.snapshots().map(
      (snapshot) => snapshot.docs
          .map(BudgetCategory.fromSnapshot)
          .toList(growable: false),
    );
  }

  Future<List<BudgetCategory>> fetchCategories(String uid) async {
    final snapshot = await _firestore
        .collection(userCategoriesCollectionPath(uid))
        .orderBy('name')
        .get();
    return snapshot.docs
        .map(BudgetCategory.fromSnapshot)
        .toList(growable: false);
  }

  Future<BudgetCategory> createCategory({
    required String uid,
    required String name,
    required CategoryType type,
    required double targetAmount,
  }) async {
    await _firestore.doc(artifactsDocumentPath()).set(
      {'lastCategoryCreatedAt': FieldValue.serverTimestamp()},
      SetOptions(merge: true),
    );
    final collection = _firestore.collection(userCategoriesCollectionPath(uid));
    final docRef = collection.doc();
    final payload = {
      'name': name,
      'type': categoryTypeToString(type),
      'targetAmount': targetAmount,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    };
    await docRef.set(payload);
    final snapshot = await docRef.get();
    return BudgetCategory.fromSnapshot(snapshot);
  }

  Future<void> updateCategory({
    required String uid,
    required String categoryId,
    required String name,
    required CategoryType type,
    required double targetAmount,
  }) async {
    final docRef =
        _firestore.doc(userCategoryDocumentPath(uid, categoryId));
    final payload = {
      'name': name,
      'type': categoryTypeToString(type),
      'targetAmount': targetAmount,
      'updatedAt': FieldValue.serverTimestamp(),
    };
    await docRef.update(payload);
  }

  Future<void> deleteCategory({
    required String uid,
    required String categoryId,
  }) async {
    final docRef =
        _firestore.doc(userCategoryDocumentPath(uid, categoryId));
    await docRef.delete();
  }
}
