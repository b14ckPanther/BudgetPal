import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:budgetpal/l10n/app_localizations.dart';

import 'core/app_settings/app_settings_controller.dart';
import 'core/constants/app_theme.dart';
import 'core/telemetry/analytics_service.dart';
import 'features/auth/presentation/auth_gate.dart';

class NasFinProApp extends ConsumerWidget {
  const NasFinProApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(appSettingsControllerProvider);
    ref.watch(appStartupTelemetryProvider);

    final locale = settings.locale;

    return MaterialApp(
      title: 'BudgetPal',
      debugShowCheckedModeBanner: false,
      themeMode: settings.themeMode,
      theme: NasFinProTheme.light(locale),
      darkTheme: NasFinProTheme.dark(locale),
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      localeListResolutionCallback: (locales, supported) {
        if (locales == null || locales.isEmpty) {
          return locale;
        }
        final preferred = locales.first;
        final match = supported.firstWhere(
          (supportedLocale) =>
              supportedLocale.languageCode == preferred.languageCode,
          orElse: () => locale,
        );
        return match;
      },
      home: const AuthGate(),
    );
  }
}
