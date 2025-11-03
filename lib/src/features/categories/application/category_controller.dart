import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/telemetry/analytics_service.dart';
import '../../auth/application/user_profile_provider.dart';
import '../data/category_repository.dart';
import '../domain/budget_category.dart';
import '../domain/budget_category_draft.dart';

final categoryControllerProvider =
    StateNotifierProvider<CategoryController, AsyncValue<void>>((ref) {
  final repository = ref.watch(categoryRepositoryProvider);
  final telemetry = ref.watch(analyticsServiceProvider);
  return CategoryController(ref: ref, repository: repository, telemetry: telemetry);
});

class CategoryController extends StateNotifier<AsyncValue<void>> {
  CategoryController({
    required this.ref,
    required this.repository,
    required this.telemetry,
  }) : super(const AsyncData(null));

  final Ref ref;
  final CategoryRepository repository;
  final AnalyticsService telemetry;

  Future<void> createCategory(BudgetCategoryDraft draft) async {
    final uid = ref.read(authUserProvider)?.uid;
    if (uid == null) {
      return;
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await repository.createCategory(
        uid: uid,
        name: draft.name,
        type: draft.type,
        targetAmount: draft.targetAmount,
      );
      await telemetry.logCategoryCreated(draft);
    });
  }

  Future<void> updateCategory(BudgetCategoryDraft draft) async {
    final uid = ref.read(authUserProvider)?.uid;
    final categoryId = draft.id;
    if (uid == null || categoryId == null) {
      return;
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await repository.updateCategory(
        uid: uid,
        categoryId: categoryId,
        name: draft.name,
        type: draft.type,
        targetAmount: draft.targetAmount,
      );
      await telemetry.logCategoryUpdated(draft);
    });
  }

  Future<void> deleteCategory(
    String categoryId, {
    CategoryType? type,
  }) async {
    final uid = ref.read(authUserProvider)?.uid;
    if (uid == null) {
      return;
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await repository.deleteCategory(
        uid: uid,
        categoryId: categoryId,
      );
      await telemetry.logCategoryDeleted(
        categoryId: categoryId,
        type: type,
      );
    });
  }
}
