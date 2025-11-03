import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/firebase_paths.dart';
import '../../../core/firebase/firebase_providers.dart';
import '../domain/user_profile.dart';

final userProfileRepositoryProvider = Provider<UserProfileRepository>((ref) {
  final firestore = ref.watch(firebaseFirestoreProvider);
  return UserProfileRepository(firestore);
});

class UserProfileRepository {
  UserProfileRepository(this._firestore);

  final FirebaseFirestore _firestore;

  Future<void> createUserProfile({
    required String uid,
    required String email,
  }) async {
    await _firestore.doc(artifactsDocumentPath()).set({
      'initializedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
    final docRef = _firestore.doc(userDocumentPath(uid));
    await docRef.set({
      'email': email,
      'bankBalance': 0,
      'overdraftLimit': 0,
      'preferredThemeMode': 'system',
      'preferredLocale': 'he',
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Stream<UserProfile?> watchUserProfile(String uid) {
    final docRef = _firestore.doc(userDocumentPath(uid));
    return docRef.snapshots().map((snapshot) {
      if (!snapshot.exists) {
        return null;
      }
      return UserProfile.fromSnapshot(snapshot);
    });
  }

  Future<UserProfile?> fetchUserProfile(String uid) async {
    final docRef = _firestore.doc(userDocumentPath(uid));
    final snapshot = await docRef.get();
    if (!snapshot.exists) {
      return null;
    }
    return UserProfile.fromSnapshot(snapshot);
  }

  Future<UserProfile> ensureUserProfile({
    required String uid,
    required String email,
  }) async {
    await createUserProfile(uid: uid, email: email);
    final snapshot = await _firestore.doc(userDocumentPath(uid)).get();
    return UserProfile.fromSnapshot(snapshot);
  }

  Future<void> updateFinancials({
    required String uid,
    required double bankBalance,
    required double overdraftLimit,
  }) async {
    final docRef = _firestore.doc(userDocumentPath(uid));
    await docRef.set({
      'bankBalance': bankBalance,
      'overdraftLimit': overdraftLimit,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> updatePreferences({
    required String uid,
    required ThemeMode themeMode,
    required Locale locale,
  }) async {
    final docRef = _firestore.doc(userDocumentPath(uid));
    await docRef.set({
      'preferredThemeMode': themeModeToPreferenceString(themeMode),
      'preferredLocale': localeToPreferenceString(locale),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }
}
