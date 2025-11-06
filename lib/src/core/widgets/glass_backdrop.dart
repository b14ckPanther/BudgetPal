import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Animated gradient backdrop with subtle floating orbs, used to provide
/// a modern glassmorphism look across multiple screens.
class AnimatedGlassBackdrop extends StatefulWidget {
  const AnimatedGlassBackdrop({super.key});

  @override
  State<AnimatedGlassBackdrop> createState() => _AnimatedGlassBackdropState();
}

class _AnimatedGlassBackdropState extends State<AnimatedGlassBackdrop>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 20),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          final t = (math.sin(_controller.value * math.pi * 2) + 1) / 2;
          final startColor = Color.lerp(
            colorScheme.surface,
            colorScheme.primaryContainer,
            isDark ? 0.25 + (0.2 * t) : 0.4 + (0.25 * t),
          )!;
          final endColor = Color.lerp(
            colorScheme.surface,
            colorScheme.secondaryContainer,
            isDark ? 0.2 + (0.2 * (1 - t)) : 0.35 + (0.2 * (1 - t)),
          )!;

          return Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [startColor, endColor],
              ),
            ),
            child: Stack(
              children: [
                Positioned(
                  top: -80 + (40 * t),
                  right: -60,
                  child: _GlassOrb(
                    size: 220,
                    color: colorScheme.primary.withValues(
                      alpha: isDark ? 0.18 : 0.14,
                    ),
                  ),
                ),
                Positioned(
                  bottom: -100 + (60 * (1 - t)),
                  left: -40,
                  child: _GlassOrb(
                    size: 200,
                    color: colorScheme.secondary.withValues(
                      alpha: isDark ? 0.2 : 0.16,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _GlassOrb extends StatelessWidget {
  const _GlassOrb({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.5),
            blurRadius: size * 0.6,
            spreadRadius: size * 0.15,
          ),
        ],
      ),
    );
  }
}
