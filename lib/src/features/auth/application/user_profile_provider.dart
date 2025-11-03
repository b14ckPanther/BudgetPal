import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/user_profile_repository.dart';
import '../domain/user_profile.dart';
import 'auth_controller.dart';

final authUserProvider = Provider<User?>((ref) {
  final authState = ref.watch(authStateChangesProvider);
  return authState.value;
});

final userProfileStreamProvider = StreamProvider<UserProfile?>((ref) {
  final user = ref.watch(authUserProvider);
  if (user == null) {
    return Stream<UserProfile?>.value(null);
  }
  final repository = ref.watch(userProfileRepositoryProvider);
  return repository.watchUserProfile(user.uid).asyncMap((profile) async {
    if (profile != null) {
      return profile;
    }
    final ensured = await repository.ensureUserProfile(
      uid: user.uid,
      email: user.email ?? '',
    );
    return ensured;
  });
});
