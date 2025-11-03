import 'dart:async';

import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/categories/domain/budget_category.dart';
import '../../features/categories/domain/budget_category_draft.dart';
import '../../features/transactions/domain/transaction_draft.dart';
import '../../features/transactions/domain/transaction_model.dart';

final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  final analytics = FirebaseAnalytics.instance;
  return AnalyticsService(analytics);
});

final appStartupTelemetryProvider = Provider<void>((ref) {
  final analytics = ref.watch(analyticsServiceProvider);
  unawaited(analytics.logAppOpenSafely());
});

class AnalyticsService {
  AnalyticsService(this._analytics);

  final FirebaseAnalytics _analytics;

  Future<void> logAppOpenSafely() => _safeLog(_analytics.logAppOpen);

  Future<void> logScreenView({
    required String screenName,
  }) {
    return _safeLog(
      () => _analytics.logScreenView(screenName: screenName),
    );
  }

  Future<void> logAuthEvent({
    required String action,
    bool success = true,
    String? errorCode,
  }) {
    final params = <String, Object>{
      'success': _boolToInt(success),
      if (errorCode != null) 'error': errorCode,
    };
    return _safeLog(
      () => _analytics.logEvent(
        name: 'auth_$action',
        parameters: params,
      ),
    );
  }

  Future<void> logTransactionCreated(TransactionDraft draft) {
    return _safeLog(
      () => _analytics.logEvent(
        name: 'transaction_created',
        parameters: _transactionParams(draft),
      ),
    );
  }

  Future<void> logTransactionUpdated(TransactionDraft draft) {
    return _safeLog(
      () => _analytics.logEvent(
        name: 'transaction_updated',
        parameters: _transactionParams(draft),
      ),
    );
  }

  Future<void> logTransactionDeleted({
    required String transactionId,
    String? categoryId,
    double? amount,
    TransactionType? type,
  }) {
    final params = <String, Object>{
      'transaction_id': transactionId,
      if (categoryId != null) 'category_id': categoryId,
      if (amount != null) 'amount': amount,
      if (type != null) 'type': type.name,
    };
    return _safeLog(
      () => _analytics.logEvent(
        name: 'transaction_deleted',
        parameters: params,
      ),
    );
  }

  Future<void> logCategoryCreated(BudgetCategoryDraft draft) {
    final params = <String, Object>{
      'category_type': draft.type.name,
      'target_amount': draft.targetAmount,
    };
    return _safeLog(
      () => _analytics.logEvent(
        name: 'category_created',
        parameters: params,
      ),
    );
  }

  Future<void> logCategoryUpdated(BudgetCategoryDraft draft) {
    final params = <String, Object>{
      'category_type': draft.type.name,
      'target_amount': draft.targetAmount,
    };
    return _safeLog(
      () => _analytics.logEvent(
        name: 'category_updated',
        parameters: params,
      ),
    );
  }

  Future<void> logCategoryDeleted({
    required String categoryId,
    CategoryType? type,
  }) {
    final params = <String, Object>{
      'category_id': categoryId,
      if (type != null) 'category_type': type.name,
    };
    return _safeLog(
      () => _analytics.logEvent(
        name: 'category_deleted',
        parameters: params,
      ),
    );
  }

  Future<void> logInvoiceImport({
    required String source,
    required bool success,
    int? suggestions,
    String? errorCode,
  }) {
    final params = <String, Object>{
      'source': source,
      'success': _boolToInt(success),
      if (suggestions != null) 'suggestions': suggestions,
      if (errorCode != null) 'error': errorCode,
    };
    return _safeLog(
      () => _analytics.logEvent(
        name: 'invoice_import',
        parameters: params,
      ),
    );
  }

  Map<String, Object> _transactionParams(TransactionDraft draft) {
    return <String, Object>{
      'category_id': draft.categoryId,
      'amount': draft.amount,
      'type': draft.type.name,
    };
  }

  Future<void> _safeLog(Future<void> Function() operation) async {
    try {
      await operation();
    } catch (error, stackTrace) {
      if (kDebugMode) {
        debugPrint('Analytics log failed: $error\n$stackTrace');
      }
    }
  }

  int _boolToInt(bool value) => value ? 1 : 0;
}
