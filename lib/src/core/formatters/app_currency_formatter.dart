import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class AppCurrencyFormatter {
  AppCurrencyFormatter._();

  static const String symbol = '\u20AA';

  static NumberFormat _formatter(Locale? locale) {
    final localeName = locale?.toLanguageTag();
    return NumberFormat.currency(
      locale: localeName,
      symbol: symbol,
      decimalDigits: 2,
    );
  }

  static String format(
    double value, {
    Locale? locale,
  }) {
    return _formatter(locale).format(value);
  }

  static String formatWithSign(
    double value, {
    required bool isPositive,
    Locale? locale,
  }) {
    final formatted = format(value.abs(), locale: locale);
    final sign = isPositive ? '+' : '-';
    return '$sign$formatted';
  }
}
