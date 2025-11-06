import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:budgetpal/l10n/app_localizations.dart';

import '../../../core/app_settings/app_settings_controller.dart';
import '../../../core/app_settings/app_settings_state.dart';
import '../application/auth_controller.dart';
import '../data/auth_local_storage.dart';
import '../utils/auth_error_translator.dart';
import '../../../core/widgets/glass_backdrop.dart';
import '../../../core/widgets/glass_panel.dart';

class AuthPage extends ConsumerStatefulWidget {
  const AuthPage({super.key});

  @override
  ConsumerState<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends ConsumerState<AuthPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _usernameController = TextEditingController();
  bool _isLogin = true;
  bool _rememberMe = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      final creds = await ref.read(authLocalStorageProvider).loadCredentials();
      if (!mounted) {
        return;
      }
      setState(() {
        _rememberMe = creds.remember;
        if (creds.email.isNotEmpty) {
          _emailController.text = creds.email;
        }
      });
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _usernameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    FocusScope.of(context).unfocus();
    final identifierOrEmail = _emailController.text.trim();
    final password = _passwordController.text.trim();

    final authController = ref.read(authControllerProvider.notifier);

    if (_isLogin) {
      await authController.signIn(
        identifier: identifierOrEmail,
        password: password,
      );
    } else {
      final username = _usernameController.text.trim();
      await authController.register(
        email: identifierOrEmail,
        password: password,
        username: username,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    ref.listen<AsyncValue<void>>(authControllerProvider, (previous, next) {
      next.when(
        data: (_) {
          if (previous?.isLoading == true) {
            scheduleMicrotask(() {
              final storage = ref.read(authLocalStorageProvider);
              storage.saveCredentials(
                remember: _rememberMe,
                email: _emailController.text.trim(),
              );
            });
          }
        },
        error: (error, stackTrace) {
          final message = mapAuthError(l10n, error);
          _showSnackBar(message);
        },
        loading: () {},
      );
    });
    final authState = ref.watch(authControllerProvider);
    final settings = ref.watch(appSettingsControllerProvider);
    final appSettings = ref.read(appSettingsControllerProvider.notifier);

    final isLoading = authState.isLoading;

    return Scaffold(
      body: Stack(
        children: [
          const AnimatedGlassBackdrop(),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 520),
                  child: AutofillGroup(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        GlassPanel(
                          padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                          child: _HeaderSection(
                            onThemeToggle: appSettings.toggleThemeMode,
                            currentLocale: settings.locale,
                            onLocaleChanged: appSettings.updateLocale,
                          ),
                        ),
                        const SizedBox(height: 20),
                        GlassPanel(
                          padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                _isLogin
                                    ? l10n.authWelcome
                                    : l10n.authRegisterTitle,
                                style: Theme.of(context).textTheme.headlineSmall
                                    ?.copyWith(fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 24),
                              Form(
                                key: _formKey,
                                autovalidateMode:
                                    AutovalidateMode.onUserInteraction,
                                child: Column(
                                  children: [
                                    TextFormField(
                                      controller: _emailController,
                                      autofillHints: _isLogin
                                          ? const [AutofillHints.username]
                                          : const [AutofillHints.email],
                                      textInputAction: TextInputAction.next,
                                      enabled: !isLoading,
                                      keyboardType: TextInputType.emailAddress,
                                      decoration: InputDecoration(
                                        labelText: _isLogin
                                            ? l10n.authIdentifierLabel
                                            : l10n.emailLabel,
                                        helperText: _isLogin
                                            ? l10n.authIdentifierHelper
                                            : null,
                                        prefixIcon: const Icon(
                                          Icons.alternate_email_rounded,
                                        ),
                                      ),
                                      validator: (value) {
                                        final trimmed = value?.trim() ?? '';
                                        if (trimmed.isEmpty) {
                                          return _isLogin
                                              ? l10n.authIdentifierRequired
                                              : l10n.invalidEmailError;
                                        }
                                        if (!_isLogin &&
                                            !trimmed.contains('@')) {
                                          return l10n.invalidEmailError;
                                        }
                                        return null;
                                      },
                                    ),
                                    if (!_isLogin) ...[
                                      const SizedBox(height: 16),
                                      TextFormField(
                                        controller: _usernameController,
                                        textInputAction: TextInputAction.next,
                                        enabled: !isLoading,
                                        decoration: InputDecoration(
                                          labelText: l10n.usernameLabel,
                                          helperText: l10n.usernameHelper,
                                          prefixIcon: const Icon(
                                            Icons.person_outline,
                                          ),
                                        ),
                                        validator: (value) {
                                          final trimmed = value?.trim() ?? '';
                                          if (trimmed.isEmpty) {
                                            return l10n.usernameRequiredError;
                                          }
                                          final isValid = RegExp(
                                            r'^[A-Za-z0-9._-]{3,}$',
                                          ).hasMatch(trimmed);
                                          if (!isValid) {
                                            return l10n.usernameInvalidError;
                                          }
                                          return null;
                                        },
                                      ),
                                    ],
                                    const SizedBox(height: 16),
                                    TextFormField(
                                      controller: _passwordController,
                                      autofillHints: const [
                                        AutofillHints.password,
                                      ],
                                      enabled: !isLoading,
                                      obscureText: _obscurePassword,
                                      textInputAction: _isLogin
                                          ? TextInputAction.done
                                          : TextInputAction.next,
                                      onFieldSubmitted: (_) {
                                        if (_isLogin) {
                                          _submit();
                                        }
                                      },
                                      decoration: InputDecoration(
                                        labelText: l10n.passwordLabel,
                                        prefixIcon: const Icon(
                                          Icons.lock_outline,
                                        ),
                                        suffixIcon: IconButton(
                                          onPressed: () {
                                            setState(() {
                                              _obscurePassword =
                                                  !_obscurePassword;
                                            });
                                          },
                                          tooltip: _obscurePassword
                                              ? l10n.passwordToggleShow
                                              : l10n.passwordToggleHide,
                                          icon: Icon(
                                            _obscurePassword
                                                ? Icons.visibility_off
                                                : Icons.visibility,
                                          ),
                                        ),
                                      ),
                                      validator: (value) {
                                        if (value == null || value.length < 6) {
                                          return l10n.passwordTooShortError;
                                        }
                                        return null;
                                      },
                                    ),
                                    AnimatedSwitcher(
                                      duration: const Duration(
                                        milliseconds: 200,
                                      ),
                                      child: _isLogin
                                          ? const SizedBox.shrink()
                                          : Padding(
                                              padding: const EdgeInsets.only(
                                                top: 16,
                                              ),
                                              child: TextFormField(
                                                key: const ValueKey(
                                                  'confirmPassword',
                                                ),
                                                controller:
                                                    _confirmPasswordController,
                                                autofillHints: const [
                                                  AutofillHints.newPassword,
                                                ],
                                                enabled: !isLoading,
                                                obscureText:
                                                    _obscureConfirmPassword,
                                                textInputAction:
                                                    TextInputAction.done,
                                                onFieldSubmitted: (_) =>
                                                    _submit(),
                                                decoration: InputDecoration(
                                                  labelText:
                                                      l10n.confirmPasswordLabel,
                                                  prefixIcon: const Icon(
                                                    Icons.lock_person_outlined,
                                                  ),
                                                  suffixIcon: IconButton(
                                                    onPressed: () {
                                                      setState(() {
                                                        _obscureConfirmPassword =
                                                            !_obscureConfirmPassword;
                                                      });
                                                    },
                                                    tooltip:
                                                        _obscureConfirmPassword
                                                        ? l10n.passwordToggleShow
                                                        : l10n.passwordToggleHide,
                                                    icon: Icon(
                                                      _obscureConfirmPassword
                                                          ? Icons.visibility_off
                                                          : Icons.visibility,
                                                    ),
                                                  ),
                                                ),
                                                validator: (value) {
                                                  if (value !=
                                                      _passwordController
                                                          .text) {
                                                    return l10n
                                                        .passwordMismatchError;
                                                  }
                                                  return null;
                                                },
                                              ),
                                            ),
                                    ),
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Checkbox(
                                          value: _rememberMe,
                                          onChanged: isLoading
                                              ? null
                                              : (value) {
                                                  setState(() {
                                                    _rememberMe =
                                                        value ?? false;
                                                  });
                                                },
                                        ),
                                        Expanded(
                                          child: Text(
                                            l10n.rememberMeLabel,
                                            maxLines: 2,
                                          ),
                                        ),
                                        if (_isLogin) ...[
                                          const SizedBox(width: 12),
                                          TextButton(
                                            onPressed: isLoading
                                                ? null
                                                : () => _showResetDialog(l10n),
                                            child: Text(
                                              l10n.forgotPasswordLink,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ], // <--- This was missing in your original code and caused the errors!
                                ),
                              ),
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton(
                                  onPressed: isLoading ? null : _submit,
                                  child: isLoading
                                      ? SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Theme.of(
                                              context,
                                            ).colorScheme.onPrimary,
                                          ),
                                        )
                                      : Text(
                                          _isLogin
                                              ? l10n.signInButton
                                              : l10n.signUpButton,
                                        ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _isLogin = !_isLogin;
                                    _confirmPasswordController.clear();
                                    _usernameController.clear();
                                  });
                                },
                                child: Text(
                                  _isLogin
                                      ? l10n.toggleToRegister
                                      : l10n.toggleToLogin,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showSnackBar(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _showResetDialog(AppLocalizations l10n) async {
    final controller = TextEditingController(
      text: _emailController.text.trim(),
    );
    final formKey = GlobalKey<FormState>();

    final result = await showDialog<String>(
      context: context,
      builder: (context) {
        final materialL10n = MaterialLocalizations.of(context);
        return AlertDialog(
          title: Text(l10n.passwordResetTitle),
          content: Form(
            key: formKey,
            autovalidateMode: AutovalidateMode.onUserInteraction,
            child: TextFormField(
              controller: controller,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(labelText: l10n.emailLabel),
              validator: (value) {
                if (value == null ||
                    value.trim().isEmpty ||
                    !value.contains('@')) {
                  return l10n.invalidEmailError;
                }
                return null;
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(materialL10n.cancelButtonLabel),
            ),
            FilledButton(
              onPressed: () {
                if (formKey.currentState?.validate() ?? false) {
                  Navigator.of(context).pop(controller.text.trim());
                }
              },
              child: Text(l10n.passwordResetSendButton),
            ),
          ],
        );
      },
    );

    if (result != null && result.isNotEmpty) {
      await _sendPasswordReset(result, l10n);
    }
  }

  Future<void> _sendPasswordReset(String email, AppLocalizations l10n) async {
    final controller = ref.read(authControllerProvider.notifier);
    final result = await controller.sendPasswordReset(email);
    result.when(
      data: (_) => _showSnackBar(l10n.passwordResetSuccess),
      error: (error, stack) => _showSnackBar(mapAuthError(l10n, error)),
      loading: () {},
    );
  }
}

class _HeaderSection extends ConsumerWidget {
  const _HeaderSection({
    required this.onThemeToggle,
    required this.currentLocale,
    required this.onLocaleChanged,
  });

  final VoidCallback onThemeToggle;
  final Locale currentLocale;
  final void Function(Locale locale) onLocaleChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final isDark =
        ref.watch(appSettingsControllerProvider).themeMode == ThemeMode.dark;

    return Row(
      children: [
        Text(l10n.appTitle, style: Theme.of(context).textTheme.titleLarge),
        const Spacer(),
        Tooltip(
          message: l10n.themeToggleLabel,
          child: IconButton(
            onPressed: onThemeToggle,
            icon: Icon(isDark ? Icons.dark_mode : Icons.light_mode),
          ),
        ),
        const SizedBox(width: 12),
        DropdownButton<Locale>(
          value: currentLocale,
          onChanged: (locale) {
            if (locale != null) {
              onLocaleChanged(locale);
            }
          },
          underline: const SizedBox.shrink(),
          items: AppLocales.supported
              .map(
                (locale) => DropdownMenuItem(
                  value: locale,
                  child: Text(
                    _localeDisplayName(locale),
                    textDirection:
                        locale.languageCode == 'ar' ||
                            locale.languageCode == 'he'
                        ? TextDirection.rtl
                        : TextDirection.ltr,
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }

  String _localeDisplayName(Locale locale) {
    switch (locale.languageCode) {
      case 'he':
        return 'ע';
      case 'ar':
        return 'ع';
      default:
        return 'EN';
    }
  }
}
