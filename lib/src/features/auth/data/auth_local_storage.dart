import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _emailKey = 'nasfinpro_last_email';
const _rememberKey = 'nasfinpro_remember_me';

final authLocalStorageProvider = Provider<AuthLocalStorage>((ref) {
  return AuthLocalStorage();
});

class AuthLocalStorage {
  Future<StoredCredentials> loadCredentials() async {
    final prefs = await SharedPreferences.getInstance();
    final remember = prefs.getBool(_rememberKey) ?? false;
    final email = remember ? (prefs.getString(_emailKey) ?? '') : '';
    return StoredCredentials(email: email, remember: remember);
  }

  Future<void> saveCredentials({
    required bool remember,
    required String email,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_rememberKey, remember);
    if (remember) {
      await prefs.setString(_emailKey, email);
    } else {
      await prefs.remove(_emailKey);
    }
  }
}

class StoredCredentials {
  const StoredCredentials({required this.email, required this.remember});

  final String email;
  final bool remember;
}
