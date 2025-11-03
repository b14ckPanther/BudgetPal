import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/telemetry/analytics_service.dart';
import '../data/auth_repository.dart';
import '../data/user_profile_repository.dart';

final authControllerProvider =
    StateNotifierProvider<AuthController, AsyncValue<void>>((ref) {
      final authRepository = ref.watch(authRepositoryProvider);
      final profileRepository = ref.watch(userProfileRepositoryProvider);
      final telemetry = ref.watch(analyticsServiceProvider);
      return AuthController(
        authRepository: authRepository,
        profileRepository: profileRepository,
        telemetry: telemetry,
      );
    });

final authStateChangesProvider = StreamProvider<User?>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  return authRepository.authStateChanges();
});

class AuthController extends StateNotifier<AsyncValue<void>> {
  AuthController({
    required this.authRepository,
    required this.profileRepository,
    required this.telemetry,
  }) : super(const AsyncData(null));

  final AuthRepository authRepository;
  final UserProfileRepository profileRepository;
  final AnalyticsService telemetry;

  Future<void> signIn({
    required String identifier,
    required String password,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      try {
        var resolvedEmail = identifier.trim();
        if (!resolvedEmail.contains('@')) {
          final email = await profileRepository.emailForUsername(resolvedEmail);
          if (email == null || email.isEmpty) {
            throw const UsernameNotFoundException();
          }
          resolvedEmail = email;
        }
        await authRepository.signIn(email: resolvedEmail, password: password);
        await telemetry.logAuthEvent(action: 'sign_in');
      } on UsernameNotFoundException {
        await telemetry.logAuthEvent(
          action: 'sign_in',
          success: false,
          errorCode: 'username-not-found',
        );
        rethrow;
      } on FirebaseAuthException catch (error) {
        await telemetry.logAuthEvent(
          action: 'sign_in',
          success: false,
          errorCode: error.code,
        );
        rethrow;
      } catch (_) {
        await telemetry.logAuthEvent(action: 'sign_in', success: false);
        rethrow;
      }
    });
  }

  Future<void> register({
    required String email,
    required String password,
    required String username,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      User? user;
      var usernameReserved = false;
      final normalizedUsername = profileRepository.normalizeUsername(username);
      try {
        final credential = await authRepository.signUp(
          email: email,
          password: password,
        );
        user = credential.user;
        if (user != null) {
          await profileRepository.reserveUsername(
            username: normalizedUsername,
            uid: user.uid,
            email: user.email ?? email,
          );
          usernameReserved = true;
          await profileRepository.createUserProfile(
            uid: user.uid,
            email: user.email ?? email,
            username: normalizedUsername,
          );
        }
        await telemetry.logAuthEvent(action: 'register');
      } on UsernameAlreadyTakenException {
        if (user != null) {
          await user.delete();
        }
        await telemetry.logAuthEvent(
          action: 'register',
          success: false,
          errorCode: 'username-already-in-use',
        );
        rethrow;
      } on FirebaseAuthException catch (error) {
        if (user != null) {
          await user.delete();
        }
        if (usernameReserved) {
          await profileRepository.releaseUsername(normalizedUsername);
        }
        await telemetry.logAuthEvent(
          action: 'register',
          success: false,
          errorCode: error.code,
        );
        rethrow;
      } catch (_) {
        if (user != null) {
          await user.delete();
        }
        if (usernameReserved) {
          await profileRepository.releaseUsername(normalizedUsername);
        }
        await telemetry.logAuthEvent(action: 'register', success: false);
        rethrow;
      }
    });
  }

  Future<void> signOut() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      try {
        await authRepository.signOut();
        await telemetry.logAuthEvent(action: 'sign_out');
      } catch (error) {
        await telemetry.logAuthEvent(action: 'sign_out', success: false);
        rethrow;
      }
    });
  }

  Future<AsyncValue<void>> sendPasswordReset(String email) {
    return AsyncValue.guard(() async {
      try {
        await authRepository.sendPasswordReset(email);
        await telemetry.logAuthEvent(action: 'password_reset');
      } on FirebaseAuthException catch (error) {
        await telemetry.logAuthEvent(
          action: 'password_reset',
          success: false,
          errorCode: error.code,
        );
        rethrow;
      } catch (_) {
        await telemetry.logAuthEvent(action: 'password_reset', success: false);
        rethrow;
      }
    });
  }
}
