import 'package:firebase_auth/firebase_auth.dart';

import 'package:budgetpal/l10n/app_localizations.dart';

String mapAuthError(AppLocalizations l10n, Object error) {
  if (error is FirebaseAuthException) {
    switch (error.code) {
      case 'invalid-credential':
      case 'wrong-password':
      case 'invalid-email':
        return l10n.authErrorInvalidCredentials;
      case 'user-disabled':
        return l10n.authErrorUserDisabled;
      case 'user-not-found':
        return l10n.authErrorUserNotFound;
      case 'too-many-requests':
        return l10n.authErrorTooManyRequests;
      case 'email-already-in-use':
        return l10n.authErrorEmailAlreadyInUse;
      case 'weak-password':
        return l10n.authErrorWeakPassword;
      default:
        return l10n.authErrorUnknown;
    }
  }
  return l10n.authErrorUnknown;
}
