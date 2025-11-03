import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/user_profile_provider.dart';
import '../../auth/data/user_profile_repository.dart';

final profileControllerProvider =
    StateNotifierProvider<ProfileController, AsyncValue<void>>((ref) {
  final repository = ref.watch(userProfileRepositoryProvider);
  return ProfileController(ref: ref, repository: repository);
});

class ProfileController extends StateNotifier<AsyncValue<void>> {
  ProfileController({
    required this.ref,
    required this.repository,
  }) : super(const AsyncData(null));

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
}
