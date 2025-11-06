import 'package:flutter/material.dart';

/// A reusable animated surface that blends with light/dark themes without card borders.
class GlassPanel extends StatelessWidget {
  const GlassPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(24),
    this.margin,
    this.animationOffset = 24,
    this.duration = const Duration(milliseconds: 420),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final double animationOffset;
  final Duration duration;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final colorScheme = theme.colorScheme;

    final baseColor = colorScheme.surface.withValues(
      alpha: isDark ? 0.35 : 0.14,
    );
    final accentColor = colorScheme.primary.withValues(
      alpha: isDark ? 0.16 : 0.08,
    );

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 1, end: 0),
      duration: duration,
      curve: Curves.easeOutCubic,
      builder: (context, value, childWidget) {
        final offsetY = animationOffset * value;
        final opacity = 1 - (value * 0.7);
        return Opacity(
          opacity: opacity.clamp(0.0, 1.0),
          child: Transform.translate(
            offset: Offset(0, offsetY),
            child: childWidget,
          ),
        );
      },
      child: Container(
        margin: margin,
        padding: padding,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [baseColor, accentColor],
          ),
        ),
        child: child,
      ),
    );
  }
}
