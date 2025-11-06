import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class UserProfile {
  const UserProfile({
    required this.uid,
    required this.email,
    required this.bankBalance,
    required this.overdraftLimit,
    required this.username,
    required this.preferredThemeMode,
    required this.preferredLocale,
    required this.createdAt,
    required this.updatedAt,
    this.photoUrl,
  });

  final String uid;
  final String email;
  final double bankBalance;
  final double overdraftLimit;
  final String username;
  final String preferredThemeMode;
  final String preferredLocale;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? photoUrl;

  ThemeMode get themeMode => _themeModeFromString(preferredThemeMode);

  Locale get locale => Locale(preferredLocale);

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'bankBalance': bankBalance,
      'overdraftLimit': overdraftLimit,
      'username': username,
      'preferredThemeMode': preferredThemeMode,
      'preferredLocale': preferredLocale,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'photoUrl': photoUrl,
    };
  }

  factory UserProfile.fromSnapshot(
    DocumentSnapshot<Map<String, dynamic>> snapshot,
  ) {
    final data = snapshot.data() ?? <String, dynamic>{};
    return UserProfile(
      uid: snapshot.id,
      email: data['email'] as String? ?? '',
      bankBalance: (data['bankBalance'] as num?)?.toDouble() ?? 0,
      overdraftLimit: (data['overdraftLimit'] as num?)?.toDouble() ?? 0,
      username: data['username'] as String? ?? '',
      preferredThemeMode: data['preferredThemeMode'] as String? ?? 'system',
      preferredLocale: data['preferredLocale'] as String? ?? 'he',
      createdAt: _asDateTime(data['createdAt']),
      updatedAt: _asDateTime(data['updatedAt']),
      photoUrl: data['photoUrl'] as String?,
    );
  }

  UserProfile copyWith({
    String? email,
    double? bankBalance,
    double? overdraftLimit,
    String? username,
    String? preferredThemeMode,
    String? preferredLocale,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? photoUrl,
  }) {
    return UserProfile(
      uid: uid,
      email: email ?? this.email,
      bankBalance: bankBalance ?? this.bankBalance,
      overdraftLimit: overdraftLimit ?? this.overdraftLimit,
      username: username ?? this.username,
      preferredThemeMode: preferredThemeMode ?? this.preferredThemeMode,
      preferredLocale: preferredLocale ?? this.preferredLocale,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      photoUrl: photoUrl ?? this.photoUrl,
    );
  }
}

String themeModeToPreferenceString(ThemeMode mode) {
  switch (mode) {
    case ThemeMode.dark:
      return 'dark';
    case ThemeMode.light:
      return 'light';
    case ThemeMode.system:
      return 'system';
  }
}

ThemeMode preferenceStringToThemeMode(String? value) {
  switch (value) {
    case 'dark':
      return ThemeMode.dark;
    case 'light':
      return ThemeMode.light;
    default:
      return ThemeMode.system;
  }
}

Locale preferenceStringToLocale(String? value) {
  if (value == null || value.isEmpty) {
    return const Locale('he');
  }
  return Locale(value);
}

String localeToPreferenceString(Locale locale) => locale.languageCode;

DateTime? _asDateTime(dynamic value) {
  if (value is Timestamp) {
    return value.toDate();
  }
  if (value is DateTime) {
    return value;
  }
  return null;
}

ThemeMode _themeModeFromString(String value) {
  return preferenceStringToThemeMode(value);
}
