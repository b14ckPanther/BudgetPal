import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class NasFinProPalette {
  static const Color primary = Color(0xFF0D9488); // teal-500
  static const Color primaryStrong = Color(0xFF0F766E); // teal-600
  static const Color accent = Color(0xFF22D3EE); // cyan-400
  static const Color neutralStrong = Color(0xFF0F172A); // slate-900
  static const Color neutral = Color(0xFF1E293B); // slate-800
  static const Color neutralSoft = Color(0xFFE2E8F0); // slate-200
  static const Color backgroundLight = Color(0xFFF8FAFC); // slate-50
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color backgroundDark = Color(0xFF0B1120); // slate-950
  static const Color surfaceDark = Color(0xFF111827); // slate-900
  static const Color borderDark = Color(0xFF1F2937); // slate-800
  static const Color textMutedDark = Color(0xFFCBD5F5);
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
}

class NasFinProTheme {
  static ThemeData light(Locale locale) {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme:
          ColorScheme.fromSeed(
            seedColor: NasFinProPalette.primary,
            brightness: Brightness.light,
          ).copyWith(
            primary: NasFinProPalette.primary,
            secondary: NasFinProPalette.accent,
            surface: NasFinProPalette.surfaceLight,
            surfaceContainerHighest: NasFinProPalette.surfaceLight,
            error: NasFinProPalette.error,
          ),
    );

    final textTheme = _textTheme(
      base.textTheme,
      base.colorScheme.onSurface,
      locale,
    );

    return base.copyWith(
      scaffoldBackgroundColor: NasFinProPalette.backgroundLight,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: NasFinProPalette.surfaceLight,
        foregroundColor: NasFinProPalette.neutralStrong,
        elevation: 0,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: NasFinProPalette.surfaceLight,
        margin: EdgeInsets.zero,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: NasFinProPalette.neutralSoft),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: NasFinProPalette.neutralSoft,
        space: 1,
        thickness: 1,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: ButtonStyle(
          padding: const WidgetStatePropertyAll<EdgeInsets>(
            EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          ),
          shape: WidgetStatePropertyAll(
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          textStyle: WidgetStatePropertyAll(
            textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: ButtonStyle(
          padding: const WidgetStatePropertyAll<EdgeInsets>(
            EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          ),
          shape: WidgetStatePropertyAll(
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          side: const WidgetStatePropertyAll(
            BorderSide(color: NasFinProPalette.neutralSoft),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: NasFinProPalette.neutralSoft),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: NasFinProPalette.neutralSoft),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: NasFinProPalette.primaryStrong,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: NasFinProPalette.error),
        ),
        labelStyle: TextStyle(color: NasFinProPalette.neutral),
        helperStyle: TextStyle(color: NasFinProPalette.neutral),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: NasFinProPalette.surfaceLight,
        selectedColor: NasFinProPalette.primary.withValues(alpha: 0.12),
        labelStyle: textTheme.labelLarge,
        side: const BorderSide(color: NasFinProPalette.neutralSoft),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: NasFinProPalette.surfaceLight,
        indicatorColor: NasFinProPalette.primary.withValues(alpha: 0.12),
        labelTextStyle: WidgetStatePropertyAll(
          textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected)
                ? NasFinProPalette.primary
                : NasFinProPalette.neutral,
          ),
        ),
      ),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: NasFinProPalette.surfaceLight,
        indicatorColor: NasFinProPalette.primary.withValues(alpha: 0.12),
        selectedIconTheme: const IconThemeData(color: NasFinProPalette.primary),
        unselectedIconTheme: const IconThemeData(
          color: NasFinProPalette.neutral,
        ),
        selectedLabelTextStyle: textTheme.labelLarge?.copyWith(
          color: NasFinProPalette.primary,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelTextStyle: textTheme.labelLarge?.copyWith(
          color: NasFinProPalette.neutral,
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: NasFinProPalette.neutralStrong,
        contentTextStyle: textTheme.bodyMedium?.copyWith(
          color: NasFinProPalette.surfaceLight,
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: NasFinProPalette.surfaceLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }

  static ThemeData dark(Locale locale) {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme:
          ColorScheme.fromSeed(
            seedColor: NasFinProPalette.accent,
            brightness: Brightness.dark,
          ).copyWith(
            primary: NasFinProPalette.accent,
            secondary: NasFinProPalette.primary,
            surface: NasFinProPalette.surfaceDark,
            surfaceContainerHighest: NasFinProPalette.surfaceDark,
            error: NasFinProPalette.error,
          ),
    );

    final textTheme = _textTheme(
      base.textTheme,
      base.colorScheme.onSurface,
      locale,
    );

    return base.copyWith(
      scaffoldBackgroundColor: NasFinProPalette.backgroundDark,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: NasFinProPalette.surfaceDark,
        foregroundColor: Colors.white,
        elevation: 0,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: NasFinProPalette.surfaceDark,
        margin: EdgeInsets.zero,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: NasFinProPalette.borderDark),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: NasFinProPalette.borderDark,
        space: 1,
        thickness: 1,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: ButtonStyle(
          padding: const WidgetStatePropertyAll<EdgeInsets>(
            EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          ),
          shape: WidgetStatePropertyAll(
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          backgroundColor: const WidgetStatePropertyAll<Color>(
            NasFinProPalette.accent,
          ),
          foregroundColor: const WidgetStatePropertyAll<Color>(
            NasFinProPalette.neutralStrong,
          ),
          textStyle: WidgetStatePropertyAll(
            textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: ButtonStyle(
          padding: const WidgetStatePropertyAll<EdgeInsets>(
            EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          ),
          shape: WidgetStatePropertyAll(
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          side: const WidgetStatePropertyAll(
            BorderSide(color: NasFinProPalette.borderDark),
          ),
          foregroundColor: const WidgetStatePropertyAll<Color>(
            NasFinProPalette.accent,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: NasFinProPalette.surfaceDark,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: NasFinProPalette.borderDark),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: NasFinProPalette.borderDark),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: NasFinProPalette.accent, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: NasFinProPalette.error),
        ),
        labelStyle: const TextStyle(color: NasFinProPalette.textMutedDark),
        helperStyle: const TextStyle(color: NasFinProPalette.textMutedDark),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: NasFinProPalette.surfaceDark,
        selectedColor: NasFinProPalette.accent.withValues(alpha: 0.18),
        labelStyle: textTheme.labelLarge,
        side: const BorderSide(color: NasFinProPalette.borderDark),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: NasFinProPalette.surfaceDark,
        indicatorColor: NasFinProPalette.accent.withValues(alpha: 0.16),
        labelTextStyle: WidgetStatePropertyAll(
          textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected)
                ? NasFinProPalette.accent
                : Colors.white70,
          ),
        ),
      ),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: NasFinProPalette.surfaceDark,
        indicatorColor: NasFinProPalette.accent.withValues(alpha: 0.16),
        selectedIconTheme: const IconThemeData(color: NasFinProPalette.accent),
        unselectedIconTheme: const IconThemeData(color: Colors.white70),
        selectedLabelTextStyle: textTheme.labelLarge?.copyWith(
          color: NasFinProPalette.accent,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelTextStyle: textTheme.labelLarge?.copyWith(
          color: Colors.white70,
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: NasFinProPalette.surfaceDark,
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: NasFinProPalette.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }

  static TextTheme _textTheme(TextTheme base, Color color, Locale locale) {
    final localized = locale.languageCode == 'ar'
        ? GoogleFonts.cairoTextTheme(base)
        : GoogleFonts.openSansTextTheme(base);

    return localized
        .apply(displayColor: color, bodyColor: color)
        .copyWith(
          headlineMedium: localized.headlineMedium?.copyWith(
            fontWeight: FontWeight.w600,
            letterSpacing: -0.1,
          ),
          titleLarge: localized.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
          bodyLarge: localized.bodyLarge?.copyWith(height: 1.4),
          labelLarge: localized.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
        );
  }
}
