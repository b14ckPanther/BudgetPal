import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:budgetpal/l10n/app_localizations.dart';

import '../application/assistant_controller.dart';
import '../domain/assistant_message.dart';
import '../../dashboard/application/dashboard_index_provider.dart';

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
    final showSuggestions = messages.length <= 1;
    final suggestions = <String>[
      l10n.assistantSuggestedTransactions,
      l10n.assistantSuggestedBudget,
      l10n.assistantSuggestedInvoice,
    ];

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          l10n.assistantTitle,
                          style: Theme.of(context).textTheme.headlineMedium,
                        ),
                      ),
                      if (messages.length > 1)
                        TextButton.icon(
                          onPressed: _isSending
                              ? null
                              : () => _handleClear(l10n),
                          icon: const Icon(Icons.delete_outline),
                          label: Text(l10n.assistantClearChat),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.assistantSubtitle,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  if (showSuggestions) ...[
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: suggestions
                          .map(
                            (suggestion) => ActionChip(
                              label: Text(suggestion),
                              onPressed: _isSending
                                  ? null
                                  : () => _handlePrompt(suggestion, l10n),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
            Expanded(
              child: _MessagesList(
                controller: _scrollController,
                messages: messages,
                onNavigate: _handleNavigation,
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
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
      itemBuilder: (context, index) {
        final message = messages[index];
        final alignment = message.fromUser
            ? Alignment.centerRight
            : Alignment.centerLeft;
        final colorScheme = Theme.of(context).colorScheme;
        final background = message.fromUser
            ? colorScheme.primary.withValues(alpha: 0.1)
            : colorScheme.surfaceContainerHighest;
        final textColor = message.fromUser
            ? colorScheme.primary
            : colorScheme.onSurface;
        return Align(
          alignment: alignment,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: background,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: message.fromUser
                      ? CrossAxisAlignment.end
                      : CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SelectableText(
                      message.text,
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(color: textColor),
                    ),
                    if (!message.fromUser && message.links.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: message.links
                            .map(
                              (link) => ActionChip(
                                label: Text(link.label),
                                onPressed: () => onNavigate(link.destination),
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
        );
      },
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemCount: messages.length,
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
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 12, 16, viewInsets.bottom + 16),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              textInputAction: TextInputAction.send,
              onSubmitted: isBusy ? null : onSubmitted,
              decoration: InputDecoration(hintText: hintText),
              enabled: !isBusy,
            ),
          ),
          const SizedBox(width: 12),
          FilledButton.icon(
            onPressed: isBusy ? null : () => onSubmitted(controller.text),
            icon: const Icon(Icons.send_outlined),
            label: Text(sendLabel),
          ),
        ],
      ),
    );
  }
}
