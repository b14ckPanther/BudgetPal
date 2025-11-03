import 'package:flutter/material.dart';

class AppProgressIndicator extends StatelessWidget {
  const AppProgressIndicator({
    super.key,
    this.label,
    this.compact = false,
  });

  final String? label;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final indicatorSize = compact ? 24.0 : 40.0;
    final indicator = SizedBox(
      height: indicatorSize,
      width: indicatorSize,
      child: const CircularProgressIndicator(),
    );

    if (compact || label == null) {
      return Center(child: indicator);
    }

    final theme = Theme.of(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          indicator,
          const SizedBox(height: 16),
          Text(
            label!,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
