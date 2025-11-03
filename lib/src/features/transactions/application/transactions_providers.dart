import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/telemetry/analytics_service.dart';
import '../../auth/application/user_profile_provider.dart';
import '../../categories/data/category_repository.dart';
import '../../categories/domain/budget_category.dart';
import '../data/transactions_repository.dart';
import '../domain/transaction_draft.dart';
import '../domain/transaction_model.dart';

class TransactionFilters {
  const TransactionFilters({
    this.categoryId,
    this.type,
    this.searchQuery = '',
    this.dateRange,
  });

  final String? categoryId;
  final TransactionType? type;
  final String searchQuery;
  final DateTimeRange? dateRange;

  TransactionFilters copyWith({
    String? categoryId,
    TransactionType? type,
    String? searchQuery,
    DateTimeRange? dateRange,
  }) {
    return TransactionFilters(
      categoryId: categoryId ?? this.categoryId,
      type: type ?? this.type,
      searchQuery: searchQuery ?? this.searchQuery,
      dateRange: dateRange ?? this.dateRange,
    );
  }

  bool get hasFilters =>
      categoryId != null ||
      type != null ||
      searchQuery.trim().isNotEmpty ||
      dateRange != null;
}

final transactionFiltersProvider =
    StateNotifierProvider<TransactionFilterController, TransactionFilters>(
      (ref) => TransactionFilterController(),
    );

class TransactionFilterController extends StateNotifier<TransactionFilters> {
  TransactionFilterController() : super(const TransactionFilters());

  void setCategory(String? categoryId) {
    state = state.copyWith(categoryId: categoryId);
  }

  void setType(TransactionType? type) {
    state = state.copyWith(type: type);
  }

  void setSearchQuery(String value) {
    state = state.copyWith(searchQuery: value);
  }

  void setDateRange(DateTimeRange? range) {
    state = state.copyWith(dateRange: range);
  }

  void clear() {
    state = const TransactionFilters();
  }
}

final transactionsStreamProvider =
    StreamProvider.autoDispose<List<TransactionModel>>((ref) {
      final user = ref.watch(authUserProvider);
      if (user == null) {
        return const Stream<List<TransactionModel>>.empty();
      }
      final repository = ref.watch(transactionsRepositoryProvider);
      return repository.watchTransactions(user.uid);
    });

final categoriesStreamProvider =
    StreamProvider.autoDispose<List<BudgetCategory>>((ref) {
      final user = ref.watch(authUserProvider);
      if (user == null) {
        return const Stream<List<BudgetCategory>>.empty();
      }
      final repository = ref.watch(categoryRepositoryProvider);
      return repository.watchCategories(user.uid);
    });

final transactionsFilteredProvider =
    Provider.autoDispose<AsyncValue<List<TransactionModel>>>((ref) {
      final transactions = ref.watch(transactionsStreamProvider);
      final filters = ref.watch(transactionFiltersProvider);

      return transactions.whenData((items) {
        Iterable<TransactionModel> filtered = items;

        if (filters.categoryId != null && filters.categoryId!.isNotEmpty) {
          filtered = filtered.where(
            (transaction) => transaction.categoryId == filters.categoryId,
          );
        }

        if (filters.type != null) {
          filtered = filtered.where(
            (transaction) => transaction.type == filters.type,
          );
        }

        if (filters.searchQuery.isNotEmpty) {
          final query = filters.searchQuery.toLowerCase();
          filtered = filtered.where((transaction) {
            final noteMatch =
                transaction.note?.toLowerCase().contains(query) ?? false;
            final merchantMatch =
                transaction.merchant?.toLowerCase().contains(query) ?? false;
            return noteMatch || merchantMatch;
          });
        }

        if (filters.dateRange != null) {
          final start = filters.dateRange!.start;
          final end = filters.dateRange!.end;
          filtered = filtered.where((transaction) {
            final date = transaction.transactionDate;
            return !date.isBefore(start) && !date.isAfter(end);
          });
        }

        return filtered.toList(growable: false);
      });
    });

final transactionsControllerProvider =
    StateNotifierProvider<TransactionsController, AsyncValue<void>>((ref) {
      final repository = ref.watch(transactionsRepositoryProvider);
      final telemetry = ref.watch(analyticsServiceProvider);
      return TransactionsController(
        ref: ref,
        repository: repository,
        telemetry: telemetry,
      );
    });

class TransactionsController extends StateNotifier<AsyncValue<void>> {
  TransactionsController({
    required this.ref,
    required this.repository,
    required this.telemetry,
  }) : super(const AsyncData(null));

  final Ref ref;
  final TransactionsRepository repository;
  final AnalyticsService telemetry;

  Future<bool> create(TransactionDraft draft) async {
    final uid = ref.read(authUserProvider)?.uid;
    if (uid == null) return false;
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await repository.addTransaction(uid: uid, transaction: draft.toModel());
      await telemetry.logTransactionCreated(draft);
    });
    final success = !state.hasError;
    if (success) {
      ref.invalidate(transactionsStreamProvider);
    }
    return success;
  }

  Future<bool> update(TransactionDraft draft) async {
    final uid = ref.read(authUserProvider)?.uid;
    if (uid == null || draft.id == null) return false;
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await repository.updateTransaction(
        uid: uid,
        transaction: draft.toModel().copyWith(id: draft.id),
      );
      await telemetry.logTransactionUpdated(draft);
    });
    final success = !state.hasError;
    if (success) {
      ref.invalidate(transactionsStreamProvider);
    }
    return success;
  }

  Future<void> remove(
    String transactionId, {
    TransactionModel? transaction,
  }) async {
    final uid = ref.read(authUserProvider)?.uid;
    if (uid == null) return;
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await repository.deleteTransaction(
        uid: uid,
        transactionId: transactionId,
      );
      await telemetry.logTransactionDeleted(
        transactionId: transactionId,
        categoryId: transaction?.categoryId,
        amount: transaction?.amount,
        type: transaction?.type,
      );
    });
    if (!state.hasError) {
      ref.invalidate(transactionsStreamProvider);
    }
  }
}
