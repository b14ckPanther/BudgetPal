import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/user_profile_provider.dart';
import '../../auth/data/user_profile_repository.dart';
import '../../../core/firebase/firebase_providers.dart';

final profileControllerProvider =
    StateNotifierProvider<ProfileController, AsyncValue<void>>((ref) {
      final repository = ref.watch(userProfileRepositoryProvider);
      return ProfileController(ref: ref, repository: repository);
    });

class ProfileController extends StateNotifier<AsyncValue<void>> {
  ProfileController({required this.ref, required this.repository})
    : super(const AsyncData(null));

  final Ref ref;
  final UserProfileRepository repository;

  Future<void> updateFinancials({
    required double bankBalance,
    required double overdraftLimit,
  }) async {
    final uid = ref.read(authUserProvider)?.uid;
    if (uid == null) {
      return;
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await repository.updateFinancials(
        uid: uid,
        bankBalance: bankBalance,
        overdraftLimit: overdraftLimit,
      );
    });
  }

  Future<void> updateUsername({
    required String username,
    required String currentUsername,
  }) async {
    final user = ref.read(authUserProvider);
    if (user == null) {
      return;
    }

    final normalized = repository.normalizeUsername(username);
    if (normalized.isEmpty) {
      return;
    }

    if (normalized == repository.normalizeUsername(currentUsername)) {
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await repository.reserveUsername(
        username: normalized,
        uid: user.uid,
        email: user.email ?? '',
      );
      try {
        await repository.updateUsername(uid: user.uid, username: normalized);
        if (currentUsername.isNotEmpty) {
          await repository.releaseUsername(currentUsername);
        }
      } catch (error) {
        await repository.releaseUsername(normalized);
        rethrow;
      }
    });
  }

  Future<void> updateProfilePhoto({required File file}) async {
    final uid = ref.read(authUserProvider)?.uid;
    if (uid == null) {
      return;
    }
    final storage = ref.read(firebaseStorageProvider);
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final avatarRef = storage.ref('users/$uid/avatar.jpg');
      await avatarRef.putFile(
        file,
        SettableMetadata(contentType: 'image/jpeg'),
      );
      final url = await avatarRef.getDownloadURL();
      await repository.updatePhotoUrl(uid: uid, photoUrl: url);
    });
  }

  Future<void> removeProfilePhoto() async {
    final uid = ref.read(authUserProvider)?.uid;
    if (uid == null) {
      return;
    }
    final storage = ref.read(firebaseStorageProvider);
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final avatarRef = storage.ref('users/$uid/avatar.jpg');
      try {
        await avatarRef.delete();
      } on FirebaseException catch (error) {
        if (error.code != 'object-not-found') {
          rethrow;
        }
      }
      await repository.updatePhotoUrl(uid: uid, photoUrl: null);
    });
  }
}
