import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:budgetpal/l10n/app_localizations.dart';

import '../../../core/app_settings/app_settings_controller.dart';
import '../../../core/app_settings/app_settings_state.dart';
import '../../../core/widgets/app_progress_indicator.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/application/user_profile_provider.dart';
import '../../auth/domain/user_profile.dart';
import '../../auth/utils/auth_error_translator.dart';
import '../application/profile_controller.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _balanceController;
  late final TextEditingController _overdraftController;

  UserProfile? _serverProfile;
  UserProfile? _appliedProfile;
  bool _isDirty = false;
  bool _isSendingReset = false;

  @override
  void initState() {
    super.initState();
    _balanceController = TextEditingController();
    _overdraftController = TextEditingController();
  }

  @override
  void dispose() {
    _balanceController.dispose();
    _overdraftController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final profileAsync = ref.watch(userProfileStreamProvider);
    final settings = ref.watch(appSettingsControllerProvider);
    final profileUpdateState = ref.watch(profileControllerProvider);
    final authState = ref.watch(authControllerProvider);

    ref.listen<AsyncValue<void>>(profileControllerProvider,
        (previous, next) {
      next.when(
        data: (_) {
          if (previous?.isLoading == true && mounted) {
            ScaffoldMessenger.of(context)
              ..clearSnackBars()
              ..showSnackBar(
                SnackBar(content: Text(l10n.profileUpdateSuccess)),
              );
            setState(() {
              _isDirty = false;
            });
          }
        },
        error: (error, stackTrace) {
          if (!mounted) {
            return;
          }
          ScaffoldMessenger.of(context)
            ..clearSnackBars()
            ..showSnackBar(
              SnackBar(content: Text(l10n.profileUpdateError)),
            );
        },
        loading: () {},
      );
    });

    return profileAsync.when(
      data: (profile) {
        if (profile != null) {
          _maybeSyncProfile(profile);
        }
        if (profile == null) {
          return _ProfilePlaceholderView(l10n: l10n);
        }
        return _ProfileContent(
          l10n: l10n,
          formKey: _formKey,
          balanceController: _balanceController,
          overdraftController: _overdraftController,
          profile: profile,
          isDirty: _isDirty,
          isSaving: profileUpdateState.isLoading,
          isAuthBusy: authState.isLoading || _isSendingReset,
          settings: settings,
          onBalanceChanged: _markDirty,
          onOverdraftChanged: _markDirty,
          onSave: () => _submit(profile),
          onReset: _resetForm,
          onPasswordReset: () => _sendPasswordReset(profile.email, l10n),
          onSignOut: () => _confirmSignOut(l10n),
          onThemeChanged:
              ref.read(appSettingsControllerProvider.notifier).updateThemeMode,
          onLocaleChanged:
              ref.read(appSettingsControllerProvider.notifier).updateLocale,
          localeLabelBuilder: _localeDisplayName,
          overdraftHelper: l10n.profileOverdraftHelper,
        );
      },
      loading: () => AppProgressIndicator(label: l10n.loadingLabel),
      error: (error, stackTrace) => _ProfileErrorView(
        l10n: l10n,
        message: l10n.unknownError,
        details: error.toString(),
        onRetry: () => ref.invalidate(userProfileStreamProvider),
      ),
    );
  }

  void _maybeSyncProfile(UserProfile profile) {
    _serverProfile = profile;
    final applied = _appliedProfile;
    final hasUidChanged = applied?.uid != profile.uid;
    final valuesChanged = applied == null ||
        applied.bankBalance != profile.bankBalance ||
        applied.overdraftLimit != profile.overdraftLimit;
    if (hasUidChanged || (!_isDirty && valuesChanged)) {
      _applyProfileToForm(profile);
    }
  }

  void _applyProfileToForm(UserProfile profile) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      final balanceText = profile.bankBalance.toStringAsFixed(2);
      final overdraftText = profile.overdraftLimit.toStringAsFixed(2);
      if (_balanceController.text != balanceText) {
        _balanceController.value = TextEditingValue(
          text: balanceText,
          selection: TextSelection.collapsed(offset: balanceText.length),
        );
      }
      if (_overdraftController.text != overdraftText) {
        _overdraftController.value = TextEditingValue(
          text: overdraftText,
          selection: TextSelection.collapsed(offset: overdraftText.length),
        );
      }
      setState(() {
        _appliedProfile = profile;
        _isDirty = false;
      });
    });
  }

  void _markDirty() {
    if (!_isDirty) {
      setState(() {
        _isDirty = true;
      });
    }
  }

  Future<void> _submit(UserProfile profile) async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    FocusScope.of(context).unfocus();
    final balance = double.tryParse(_balanceController.text.trim()) ?? 0;
    final overdraft = double.tryParse(_overdraftController.text.trim()) ?? 0;
    await ref.read(profileControllerProvider.notifier).updateFinancials(
          bankBalance: balance,
          overdraftLimit: overdraft,
        );
  }

  void _resetForm() {
    FocusScope.of(context).unfocus();
    final profile = _serverProfile;
    if (profile != null) {
      _applyProfileToForm(profile);
    }
  }

  Future<void> _sendPasswordReset(String email, AppLocalizations l10n) async {
    if (email.isEmpty || _isSendingReset) {
      return;
    }
    setState(() {
      _isSendingReset = true;
    });
    final controller = ref.read(authControllerProvider.notifier);
    final result = await controller.sendPasswordReset(email);
    if (!mounted) {
      return;
    }
    setState(() {
      _isSendingReset = false;
    });
    result.when(
      data: (_) {
        ScaffoldMessenger.of(context)
          ..clearSnackBars()
          ..showSnackBar(
            SnackBar(content: Text(l10n.profilePasswordResetSent)),
          );
      },
      error: (error, stackTrace) {
        final message = mapAuthError(l10n, error);
        ScaffoldMessenger.of(context)
          ..clearSnackBars()
          ..showSnackBar(
            SnackBar(content: Text(message)),
          );
      },
      loading: () {},
    );
  }

  Future<void> _confirmSignOut(AppLocalizations l10n) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(l10n.profileSignOutConfirmTitle),
          content: Text(l10n.profileSignOutConfirmMessage),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(l10n.profileSignOutConfirmCancel),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(l10n.profileSignOutConfirmConfirm),
            ),
          ],
        );
      },
    );
    if (confirmed == true && mounted) {
      await ref.read(authControllerProvider.notifier).signOut();
    }
  }

  String _localeDisplayName(Locale locale) {
    switch (locale.languageCode) {
      case 'he':
        return 'עברית';
      case 'ar':
        return 'العربية';
      default:
        return 'English';
    }
  }
}

class _ProfileContent extends StatelessWidget {
  const _ProfileContent({
    required this.l10n,
    required this.formKey,
    required this.balanceController,
    required this.overdraftController,
    required this.profile,
    required this.isDirty,
    required this.isSaving,
    required this.isAuthBusy,
    required this.settings,
    required this.onBalanceChanged,
    required this.onOverdraftChanged,
    required this.onSave,
    required this.onReset,
    required this.onPasswordReset,
    required this.onSignOut,
    required this.onThemeChanged,
    required this.onLocaleChanged,
    required this.localeLabelBuilder,
    required this.overdraftHelper,
  });

  final AppLocalizations l10n;
  final GlobalKey<FormState> formKey;
  final TextEditingController balanceController;
  final TextEditingController overdraftController;
  final UserProfile profile;
  final bool isDirty;
  final bool isSaving;
  final bool isAuthBusy;
  final AppSettingsState settings;
  final VoidCallback onBalanceChanged;
  final VoidCallback onOverdraftChanged;
  final VoidCallback onSave;
  final VoidCallback onReset;
  final VoidCallback onPasswordReset;
  final VoidCallback onSignOut;
  final void Function(ThemeMode mode, {bool persist}) onThemeChanged;
  final void Function(Locale locale, {bool persist}) onLocaleChanged;
  final String Function(Locale locale) localeLabelBuilder;
  final String overdraftHelper;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.profileTitle,
            style: theme.textTheme.headlineMedium,
          ),
          const SizedBox(height: 12),
          Text(
            l10n.profileSubtitle,
            style: theme.textTheme.bodyLarge,
          ),
          const SizedBox(height: 24),
          _AccountSection(
            l10n: l10n,
            profile: profile,
            isBusy: isAuthBusy,
            onPasswordReset: onPasswordReset,
            onSignOut: onSignOut,
          ),
          const SizedBox(height: 24),
          _FinancialSection(
            l10n: l10n,
            formKey: formKey,
            balanceController: balanceController,
            overdraftController: overdraftController,
            isDirty: isDirty,
            isSaving: isSaving,
            onBalanceChanged: onBalanceChanged,
            onOverdraftChanged: onOverdraftChanged,
            onSave: onSave,
            onReset: onReset,
            overdraftHelper: overdraftHelper,
          ),
          const SizedBox(height: 24),
          _PreferencesSection(
            l10n: l10n,
            settings: settings,
            onThemeChanged: onThemeChanged,
            onLocaleChanged: onLocaleChanged,
            localeLabelBuilder: localeLabelBuilder,
          ),
        ],
      ),
    );
  }
}

class _AccountSection extends StatelessWidget {
  const _AccountSection({
    required this.l10n,
    required this.profile,
    required this.isBusy,
    required this.onPasswordReset,
    required this.onSignOut,
  });

  final AppLocalizations l10n;
  final UserProfile profile;
  final bool isBusy;
  final VoidCallback onPasswordReset;
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.profileAccountSectionTitle,
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            Text(
              l10n.profileAccountEmailLabel,
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 4),
            SelectableText(
              profile.email,
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: isBusy ? null : onPasswordReset,
                  icon: isBusy
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.mail_outline),
                  label: Text(l10n.profileResetPasswordButton),
                ),
                FilledButton.icon(
                  onPressed: isBusy ? null : onSignOut,
                  icon: const Icon(Icons.logout),
                  label: Text(l10n.logoutButton),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FinancialSection extends StatelessWidget {
  const _FinancialSection({
    required this.l10n,
    required this.formKey,
    required this.balanceController,
    required this.overdraftController,
    required this.isDirty,
    required this.isSaving,
    required this.onBalanceChanged,
    required this.onOverdraftChanged,
    required this.onSave,
    required this.onReset,
    required this.overdraftHelper,
  });

  final AppLocalizations l10n;
  final GlobalKey<FormState> formKey;
  final TextEditingController balanceController;
  final TextEditingController overdraftController;
  final bool isDirty;
  final bool isSaving;
  final VoidCallback onBalanceChanged;
  final VoidCallback onOverdraftChanged;
  final VoidCallback onSave;
  final VoidCallback onReset;
  final String overdraftHelper;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.profileFinancialSectionTitle,
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                l10n.profileFinancialSectionDescription,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: balanceController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                  signed: true,
                ),
                decoration: InputDecoration(
                  labelText: l10n.profileBankBalanceLabel,
                ),
                onChanged: (_) => onBalanceChanged(),
                validator: (value) {
                  final parsed = double.tryParse((value ?? '').trim());
                  if (parsed == null) {
                    return l10n.profileBankBalanceInvalid;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: overdraftController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                  signed: false,
                ),
                decoration: InputDecoration(
                  labelText: l10n.profileOverdraftLabel,
                  helperText: overdraftHelper,
                ),
                onChanged: (_) => onOverdraftChanged(),
                validator: (value) {
                  final parsed = double.tryParse((value ?? '').trim());
                  if (parsed == null || parsed < 0) {
                    return l10n.profileOverdraftInvalid;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  TextButton(
                    onPressed: !isDirty || isSaving ? null : onReset,
                    child: Text(l10n.profileFormReset),
                  ),
                  const Spacer(),
                  FilledButton(
                    onPressed: !isDirty || isSaving ? null : onSave,
                    child: isSaving
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(l10n.profileFormSave),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PreferencesSection extends StatelessWidget {
  const _PreferencesSection({
    required this.l10n,
    required this.settings,
    required this.onThemeChanged,
    required this.onLocaleChanged,
    required this.localeLabelBuilder,
  });

  final AppLocalizations l10n;
  final AppSettingsState settings;
  final void Function(ThemeMode mode, {bool persist}) onThemeChanged;
  final void Function(Locale locale, {bool persist}) onLocaleChanged;
  final String Function(Locale locale) localeLabelBuilder;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.profilePreferencesSectionTitle,
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            Text(
              l10n.themeToggleLabel,
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 8),
            SegmentedButton<ThemeMode>(
              segments: [
                ButtonSegment(
                  value: ThemeMode.light,
                  label: Text(l10n.profileThemeOptionLight),
                ),
                ButtonSegment(
                  value: ThemeMode.dark,
                  label: Text(l10n.profileThemeOptionDark),
                ),
                ButtonSegment(
                  value: ThemeMode.system,
                  label: Text(l10n.profileThemeOptionSystem),
                ),
              ],
              selected: {settings.themeMode},
              onSelectionChanged: (selection) =>
                  onThemeChanged(selection.first),
            ),
            const SizedBox(height: 20),
            Text(
              l10n.profileLocaleLabel,
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<Locale>(
              key: ValueKey(settings.locale),
              initialValue: settings.locale,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
              ),
              items: AppLocales.supported
                  .map(
                    (locale) => DropdownMenuItem(
                      value: locale,
                      child: Text(localeLabelBuilder(locale)),
                    ),
                  )
                  .toList(),
              onChanged: (locale) {
                if (locale != null) {
                  onLocaleChanged(locale);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfilePlaceholderView extends StatelessWidget {
  const _ProfilePlaceholderView({required this.l10n});

  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(
          l10n.profilePlaceholder,
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class _ProfileErrorView extends StatelessWidget {
  const _ProfileErrorView({
    required this.l10n,
    required this.message,
    required this.details,
    required this.onRetry,
  });

  final AppLocalizations l10n;
  final String message;
  final String details;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 440),
          child: Card(
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
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: onRetry,
                    child: Text(l10n.retryButtonLabel),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
