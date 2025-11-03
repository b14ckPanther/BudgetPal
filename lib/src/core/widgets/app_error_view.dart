import 'package:flutter/material.dart';

class AppErrorView extends StatelessWidget {
  const AppErrorView({
    super.key,
    required this.title,
    this.message,
    this.details,
    this.onRetry,
    this.retryLabel,
    this.padding = const EdgeInsets.all(24),
  });

  final String title;
  final String? message;
  final String? details;
  final VoidCallback? onRetry;
  final String? retryLabel;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasDetails = details != null && details!.trim().isNotEmpty;

    return Center(
      child: Padding(
        padding: padding,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 40,
                    color: theme.colorScheme.error,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    title,
                    style: theme.textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                  if (message != null && message!.trim().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        message!,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  if (hasDetails)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: SelectableText(
                        details!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  if (onRetry != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 20),
                      child: FilledButton(
                        onPressed: onRetry,
                        child: Text(retryLabel ?? 'Retry'),
                      ),
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
