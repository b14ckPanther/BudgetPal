import 'package:flutter/material.dart';

class AppLocales {
  static const english = Locale('en');
  static const hebrew = Locale('he');
  static const arabic = Locale('ar');

  static const supported = <Locale>[hebrew, english, arabic];
}

class AppSettingsState {
  const AppSettingsState({
    this.themeMode = ThemeMode.system,
    this.locale = AppLocales.hebrew,
  });

  final ThemeMode themeMode;
  final Locale locale;

  AppSettingsState copyWith({ThemeMode? themeMode, Locale? locale}) {
    return AppSettingsState(
      themeMode: themeMode ?? this.themeMode,
      locale: locale ?? this.locale,
    );
  }
}
