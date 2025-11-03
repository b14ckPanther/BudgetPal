import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:budgetpal/l10n/app_localizations.dart';

import '../../../core/widgets/app_splash.dart';
import '../../dashboard/presentation/dashboard_shell.dart';
import '../application/auth_controller.dart';
import '../application/user_profile_provider.dart';
import 'auth_page.dart';

class AuthGate extends ConsumerWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final authState = ref.watch(authStateChangesProvider);
    final profileState = ref.watch(userProfileStreamProvider);

    return authState.when(
      data: (user) {
        if (user == null) {
          return const AuthPage();
        }

        return profileState.when(
          data: (profile) {
            if (profile == null) {
              return const AppSplash();
            }
            return const DashboardShell();
          },
          loading: () => const AppSplash(),
          error: (error, stackTrace) => _AuthErrorView(
            message: l10n.unknownError,
            details: error.toString(),
            primaryActionLabel: l10n.retryButtonLabel,
            onPrimaryAction: () => ref.invalidate(userProfileStreamProvider),
            secondaryActionLabel: l10n.logoutButton,
            onSecondaryAction: () =>
                ref.read(authControllerProvider.notifier).signOut(),
          ),
        );
      },
      loading: () => const AppSplash(),
      error: (error, stackTrace) => _AuthErrorView(
        message: l10n.unknownError,
        details: error.toString(),
        primaryActionLabel: l10n.retryButtonLabel,
        onPrimaryAction: () => ref.invalidate(authStateChangesProvider),
      ),
    );
  }
}

class _AuthErrorView extends StatelessWidget {
  const _AuthErrorView({
    required this.message,
    required this.details,
    required this.primaryActionLabel,
    this.onPrimaryAction,
    this.secondaryActionLabel,
    this.onSecondaryAction,
  });

  final String message;
  final String details;
  final String primaryActionLabel;
  final VoidCallback? onPrimaryAction;
  final String? secondaryActionLabel;
  final VoidCallback? onSecondaryAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.error_outline,
                      color: theme.colorScheme.error,
                      size: 40,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      message,
                      style: theme.textTheme.titleMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      details,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (secondaryActionLabel != null &&
                            onSecondaryAction != null) ...[
                          TextButton(
                            onPressed: onSecondaryAction,
                            child: Text(secondaryActionLabel!),
                          ),
                          const SizedBox(width: 12),
                        ],
                        FilledButton(
                          onPressed: onPrimaryAction,
                          child: Text(primaryActionLabel),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
