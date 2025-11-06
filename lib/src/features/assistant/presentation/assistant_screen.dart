import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:budgetpal/l10n/app_localizations.dart';

import '../application/assistant_controller.dart';
import '../domain/assistant_message.dart';
import '../../dashboard/application/dashboard_index_provider.dart';
import '../../../core/widgets/glass_backdrop.dart';
import '../../../core/widgets/glass_panel.dart';

class AssistantScreen extends ConsumerStatefulWidget {
  const AssistantScreen({super.key});

  @override
  ConsumerState<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends ConsumerState<AssistantScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final l10n = AppLocalizations.of(context);
      ref.read(assistantControllerProvider.notifier).seed(l10n);
    });
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final messages = ref.watch(assistantControllerProvider);
    final suggestions = <String>[
      l10n.assistantSuggestedTransactions,
      l10n.assistantSuggestedBudget,
      l10n.assistantSuggestedInvoice,
    ];

    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          const AnimatedGlassBackdrop(),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _AssistantHeader(
                    l10n: l10n,
                    messages: messages,
                    suggestions: suggestions,
                    isBusy: _isSending,
                    onClear: () => _handleClear(l10n),
                    onSuggestionSelected: (value) => _handlePrompt(value, l10n),
                  ),
                  const SizedBox(height: 20),
                  Expanded(
                    child: GlassPanel(
                      padding: EdgeInsets.zero,
                      child: _MessagesList(
                        controller: _scrollController,
                        messages: messages,
                        onNavigate: _handleNavigation,
                      ),
                    ),
                  ),
                  _AssistantInputBar(
                    controller: _inputController,
                    hintText: l10n.assistantInputHint,
                    sendLabel: l10n.assistantSendButton,
                    isBusy: _isSending,
                    onSubmitted: (value) => _handlePrompt(value, l10n),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handlePrompt(String value, AppLocalizations l10n) async {
    final trimmed = value.trim();
    if (trimmed.isEmpty || _isSending) {
      return;
    }

    setState(() {
      _isSending = true;
    });
    _inputController.clear();

    await ref.read(assistantControllerProvider.notifier).ask(trimmed, l10n);

    await Future<void>.delayed(const Duration(milliseconds: 50));
    if (mounted && _scrollController.hasClients) {
      await _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
    }

    if (mounted) {
      setState(() {
        _isSending = false;
      });
    }
  }

  void _handleClear(AppLocalizations l10n) {
    ref.read(assistantControllerProvider.notifier).reset(l10n);
    _inputController.clear();
    setState(() {
      _isSending = false;
    });
    if (_scrollController.hasClients) {
      _scrollController.jumpTo(0);
    }
  }

  void _handleNavigation(AssistantDestination destination) {
    final index = _destinationIndex(destination);
    ref.read(dashboardIndexProvider.notifier).state = index;
  }

  int _destinationIndex(AssistantDestination destination) {
    switch (destination) {
      case AssistantDestination.home:
        return 0;
      case AssistantDestination.transactions:
        return 1;
      case AssistantDestination.budget:
        return 2;
      case AssistantDestination.assistant:
        return 3;
      case AssistantDestination.profile:
        return 4;
    }
  }
}

class _AssistantHeader extends StatelessWidget {
  const _AssistantHeader({
    required this.l10n,
    required this.messages,
    required this.suggestions,
    required this.isBusy,
    required this.onSuggestionSelected,
    required this.onClear,
  });

  final AppLocalizations l10n;
  final List<AssistantMessage> messages;
  final List<String> suggestions;
  final bool isBusy;
  final void Function(String value) onSuggestionSelected;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final showSuggestions = messages.length <= 1;

    return GlassPanel(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.assistantTitle,
                      style: theme.textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      l10n.assistantSubtitle,
                      style: theme.textTheme.bodyLarge,
                    ),
                  ],
                ),
              ),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                child: messages.length > 1
                    ? TextButton.icon(
                        key: const ValueKey('assistant_clear_button'),
                        onPressed: isBusy ? null : onClear,
                        icon: const Icon(Icons.delete_outline),
                        label: Text(l10n.assistantClearChat),
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 350),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            child: showSuggestions
                ? Padding(
                    padding: const EdgeInsets.only(top: 20),
                    child: Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: suggestions
                          .asMap()
                          .entries
                          .map(
                            (entry) => _SuggestionChip(
                              key: ValueKey(entry.value),
                              label: entry.value,
                              index: entry.key,
                              isBusy: isBusy,
                              onTap: () => onSuggestionSelected(entry.value),
                            ),
                          )
                          .toList(),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

class _MessagesList extends StatelessWidget {
  const _MessagesList({
    required this.controller,
    required this.messages,
    required this.onNavigate,
  });

  final ScrollController controller;
  final List<AssistantMessage> messages;
  final ValueChanged<AssistantDestination> onNavigate;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      controller: controller,
      physics: const BouncingScrollPhysics(),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
      itemBuilder: (context, index) {
        final message = messages[index];
        return _AnimatedMessageBubble(
          key: ValueKey(
            '${message.sentAt.millisecondsSinceEpoch}-${message.fromUser}-${message.text.hashCode}',
          ),
          message: message,
          onNavigate: onNavigate,
        );
      },
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemCount: messages.length,
    );
  }
}

class _AnimatedMessageBubble extends StatefulWidget {
  const _AnimatedMessageBubble({
    super.key,
    required this.message,
    required this.onNavigate,
  });

  final AssistantMessage message;
  final ValueChanged<AssistantDestination> onNavigate;

  @override
  State<_AnimatedMessageBubble> createState() => _AnimatedMessageBubbleState();
}

class _AnimatedMessageBubbleState extends State<_AnimatedMessageBubble>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late Animation<Offset> _slide;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 320),
    );
    _configureAnimations();
    _controller.forward();
  }

  void _configureAnimations() {
    final beginOffset = widget.message.fromUser
        ? const Offset(0.18, 0)
        : const Offset(-0.18, 0);
    _slide = Tween<Offset>(
      begin: beginOffset,
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
  }

  @override
  void didUpdateWidget(covariant _AnimatedMessageBubble oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.message.text != oldWidget.message.text ||
        widget.message.sentAt != oldWidget.message.sentAt ||
        widget.message.fromUser != oldWidget.message.fromUser) {
      _configureAnimations();
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final message = widget.message;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isUser = message.fromUser;
    final isDark = theme.brightness == Brightness.dark;
    final blendedAccent = Color.lerp(
      colorScheme.primary,
      colorScheme.secondary,
      0.2,
    )!;
    final borderRadius = BorderRadius.only(
      topLeft: const Radius.circular(24),
      topRight: const Radius.circular(24),
      bottomLeft: Radius.circular(isUser ? 20 : 12),
      bottomRight: Radius.circular(isUser ? 12 : 20),
    );
    final gradient = isUser
        ? LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [
              colorScheme.primary.withValues(alpha: 0.95),
              blendedAccent.withValues(alpha: 0.85),
            ],
          )
        : null;
    final backgroundColor = isUser
        ? null
        : colorScheme.surfaceContainerHighest.withValues(
            alpha: isDark ? 0.65 : 0.92,
          );
    final textStyle = theme.textTheme.bodyMedium?.copyWith(
      color: isUser ? colorScheme.onPrimary : colorScheme.onSurface,
    );

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: SlideTransition(
        position: _slide,
        child: FadeTransition(
          opacity: _fade,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOutCubic,
            constraints: const BoxConstraints(maxWidth: 460),
            decoration: BoxDecoration(
              gradient: gradient,
              color: backgroundColor,
              borderRadius: borderRadius,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
                  blurRadius: 26,
                  offset: const Offset(0, 14),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: isUser
                    ? CrossAxisAlignment.end
                    : CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  SelectableText(message.text, style: textStyle),
                  if (!isUser && message.links.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: message.links
                          .map(
                            (link) => ActionChip(
                              label: Text(link.label),
                              avatar: const Icon(Icons.north_east, size: 16),
                              onPressed: () =>
                                  widget.onNavigate(link.destination),
                              backgroundColor: colorScheme.secondaryContainer
                                  .withValues(alpha: isDark ? 0.55 : 0.9),
                              labelStyle: theme.textTheme.labelLarge?.copyWith(
                                color: colorScheme.onSecondaryContainer,
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SuggestionChip extends StatelessWidget {
  const _SuggestionChip({
    super.key,
    required this.label,
    required this.index,
    required this.isBusy,
    required this.onTap,
  });

  final String label;
  final int index;
  final bool isBusy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 350 + (index * 80)),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(0, (1 - value) * 12),
          child: Opacity(opacity: value, child: child),
        );
      },
      child: ActionChip(
        avatar: const Icon(Icons.auto_awesome, size: 16),
        label: Text(label),
        onPressed: isBusy ? null : onTap,
        backgroundColor: colorScheme.secondaryContainer.withValues(
          alpha: isDark ? 0.6 : 0.9,
        ),
        labelStyle: theme.textTheme.labelLarge?.copyWith(
          color: colorScheme.onSecondaryContainer,
        ),
      ),
    );
  }
}

class _AssistantInputBar extends StatelessWidget {
  const _AssistantInputBar({
    required this.controller,
    required this.hintText,
    required this.sendLabel,
    required this.onSubmitted,
    required this.isBusy,
  });

  final TextEditingController controller;
  final String hintText;
  final String sendLabel;
  final ValueChanged<String> onSubmitted;
  final bool isBusy;

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets;
    final padding = MediaQuery.of(context).padding;
    final colorScheme = Theme.of(context).colorScheme;
    final bottomInset = viewInsets.bottom > 0
        ? viewInsets.bottom + 12
        : padding.bottom + 12;

    return Padding(
      padding: EdgeInsets.fromLTRB(4, 16, 4, bottomInset),
      child: GlassPanel(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                textInputAction: TextInputAction.send,
                minLines: 1,
                maxLines: 4,
                onSubmitted: isBusy ? null : onSubmitted,
                decoration: InputDecoration(
                  hintText: hintText,
                  border: InputBorder.none,
                ),
                enabled: !isBusy,
              ),
            ),
            const SizedBox(width: 12),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              switchInCurve: Curves.easeOutBack,
              switchOutCurve: Curves.easeInBack,
              transitionBuilder: (child, animation) =>
                  ScaleTransition(scale: animation, child: child),
              child: isBusy
                  ? SizedBox(
                      key: const ValueKey('assistant_sending'),
                      height: 32,
                      width: 32,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        valueColor: AlwaysStoppedAnimation(colorScheme.primary),
                      ),
                    )
                  : FilledButton.icon(
                      key: const ValueKey('assistant_send'),
                      onPressed: () => onSubmitted(controller.text),
                      icon: const Icon(Icons.send_outlined),
                      label: Text(sendLabel),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
