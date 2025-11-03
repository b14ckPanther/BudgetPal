import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:firebase_auth/firebase_auth.dart';

import '../../features/auth/application/user_profile_provider.dart';
import '../../features/auth/data/user_profile_repository.dart';
import '../../features/auth/domain/user_profile.dart';
import 'app_settings_state.dart';

final appSettingsControllerProvider =
    StateNotifierProvider<AppSettingsController, AppSettingsState>((ref) {
      final controller = AppSettingsController(ref);
      ref.listen<User?>(
        authUserProvider,
        (previous, next) => controller.handleAuthStateChange(next),
      );
      ref.listen<AsyncValue<UserProfile?>>(userProfileStreamProvider, (
        previous,
        next,
      ) {
        next.whenData((profile) {
          if (profile != null) {
            controller.applyProfile(profile);
          } else {
            controller.resetToDefaults();
          }
        });
      });
      return controller;
    });

class AppSettingsController extends StateNotifier<AppSettingsState> {
  AppSettingsController(this._ref) : super(const AppSettingsState());

  final Ref _ref;
  bool _suppressPersistence = false;
  AppSettingsState? _pendingState;
  ThemeMode? _lastRequestedThemeMode;
  Locale? _lastRequestedLocale;

  void toggleThemeMode() {
    final nextMode = state.themeMode == ThemeMode.dark
        ? ThemeMode.light
        : ThemeMode.dark;
    updateThemeMode(nextMode);
  }

  void updateThemeMode(ThemeMode mode, {bool persist = true}) {
    if (state.themeMode == mode) {
      return;
    }
    _lastRequestedThemeMode = mode;
    state = state.copyWith(themeMode: mode);
    if (persist) {
      _persistPreferences();
    }
  }

  void updateLocale(Locale locale, {bool persist = true}) {
    if (state.locale == locale || !AppLocales.supported.contains(locale)) {
      return;
    }
    _lastRequestedLocale = locale;
    state = state.copyWith(locale: locale);
    if (persist) {
      _persistPreferences();
    }
  }

  void applyProfile(UserProfile profile) {
    if (_pendingState != null) {
      // Preserve user-selected preferences until they are synced.
      return;
    }
    _suppressPersistence = true;
    try {
      final themePreference = preferenceStringToThemeMode(
        profile.preferredThemeMode,
      );
      final localePreference = preferenceStringToLocale(
        profile.preferredLocale,
      );

      final shouldApplyTheme =
          _lastRequestedThemeMode == null ||
          _lastRequestedThemeMode == themePreference;
      final shouldApplyLocale =
          _lastRequestedLocale == null ||
          _lastRequestedLocale == localePreference;

      if (shouldApplyTheme) {
        updateThemeMode(themePreference, persist: false);
      }
      if (shouldApplyLocale) {
        updateLocale(localePreference, persist: false);
      }
    } finally {
      _suppressPersistence = false;
    }
  }

  void resetToDefaults() {
    _suppressPersistence = true;
    try {
      state = const AppSettingsState();
      _pendingState = null;
      _lastRequestedLocale = null;
      _lastRequestedThemeMode = null;
    } finally {
      _suppressPersistence = false;
    }
  }

  void handleAuthStateChange(User? user) {
    if (user != null && _pendingState != null) {
      final pending = _pendingState!;
      _pendingState = null;
      _suppressPersistence = true;
      try {
        state = state.copyWith(
          themeMode: pending.themeMode,
          locale: pending.locale,
        );
      } finally {
        _suppressPersistence = false;
      }
      _persistPreferences();
    }
  }

  void _persistPreferences() {
    if (_suppressPersistence) {
      return;
    }
    final user = _ref.read(authUserProvider);
    if (user == null) {
      _pendingState = state;
      return;
    }
    final snapshot = _pendingState ?? state;
    _pendingState = null;
    _lastRequestedThemeMode = snapshot.themeMode;
    _lastRequestedLocale = snapshot.locale;
    final repository = _ref.read(userProfileRepositoryProvider);
    unawaited(
      repository.updatePreferences(
        uid: user.uid,
        themeMode: snapshot.themeMode,
        locale: snapshot.locale,
      ),
    );
  }
}
