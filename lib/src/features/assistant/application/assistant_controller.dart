import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:budgetpal/l10n/app_localizations.dart';
import '../data/assistant_ai_service.dart';
import '../data/assistant_knowledge_base.dart';
import '../domain/assistant_message.dart';

final assistantControllerProvider =
    StateNotifierProvider<AssistantController, List<AssistantMessage>>(
      (ref) => AssistantController(ref),
    );

class AssistantController extends StateNotifier<List<AssistantMessage>> {
  AssistantController(this._ref) : super(const []);

  final Ref _ref;

  Future<void>? _requestQueue;

  void seed(AppLocalizations l10n) {
    if (state.isNotEmpty) {
      return;
    }
    state = [
      AssistantMessage(
        text: l10n.assistantPlaceholder,
        fromUser: false,
        sentAt: DateTime.now(),
        links: const [],
      ),
    ];
  }

  Future<void> ask(String input, AppLocalizations l10n) {
    final trimmed = input.trim();
    if (trimmed.isEmpty) {
      return Future.value();
    }

    final future = (_requestQueue ?? Future.value()).then(
      (_) => _processQuestion(trimmed, l10n),
    );
    _requestQueue = future;
    return future;
  }

  Future<void> _processQuestion(String question, AppLocalizations l10n) async {
    final userMessage = AssistantMessage(
      text: question,
      fromUser: true,
      sentAt: DateTime.now(),
      links: const [],
    );
    final history = [...state, userMessage];

    final thinkingMessage = AssistantMessage(
      text: l10n.assistantThinking,
      fromUser: false,
      sentAt: DateTime.now(),
      links: const [],
    );
    state = [...history, thinkingMessage];

    final fallback = AssistantKnowledgeBase.responseFor(question, l10n);
    final aiService = _ref.read(assistantAiServiceProvider);

    String response = fallback;
    try {
      final result = await aiService.getAnswer(
        question: question,
        history: history,
        locale: l10n.localeName,
      );
      response = _composeResponse(
        result: result,
        fallback: fallback,
        l10n: l10n,
      );
    } catch (_) {
      response =
          '${l10n.assistantApiError}\n\n${l10n.assistantFallbackIntro}\n\n$fallback';
    }

    final resolved = response.trim().isEmpty ? fallback : response.trim();
    final parsed = _parseResponse(
      text: resolved,
      question: question,
      l10n: l10n,
    );
    state = [
      ...history,
      thinkingMessage.copyWith(
        text: parsed.text,
        links: parsed.links,
        sentAt: DateTime.now(),
      ),
    ];
  }

  String _composeResponse({
    required AssistantAiResult result,
    required String fallback,
    required AppLocalizations l10n,
  }) {
    switch (result.status) {
      case AssistantAiStatus.success:
        return result.hasAnswer ? result.answer!.trim() : fallback;
      case AssistantAiStatus.providerMissing:
        return '${l10n.assistantProviderMissing}\n\n${l10n.assistantFallbackIntro}\n\n$fallback';
      case AssistantAiStatus.failure:
        return '${l10n.assistantApiError}\n\n${l10n.assistantFallbackIntro}\n\n$fallback';
      case AssistantAiStatus.knowledgeBase:
        return fallback;
    }
  }

  _ParsedAssistantResponse _parseResponse({
    required String text,
    required String question,
    required AppLocalizations l10n,
  }) {
    final navRegex = RegExp(
      r'\[([^\]]+)\]\(nav:\/\/([a-z_]+)\)',
      caseSensitive: false,
    );
    final links = <AssistantLink>[];
    var cleaned = text;
    final matches = navRegex.allMatches(text).toList();
    for (final match in matches) {
      final label = match.group(1);
      final target = match.group(2);
      final destination = _destinationFromTag(target);
      if (label != null && destination != null) {
        final localized = _localizedLabel(destination, l10n);
        final exists = links.any((link) => link.destination == destination);
        if (!exists) {
          links.add(AssistantLink(label: localized, destination: destination));
        }
        cleaned = cleaned.replaceFirst(match.group(0)!, label);
      }
    }

    if (links.isEmpty) {
      final inferred = _inferDestinations('$question\n$cleaned');
      links.addAll(
        inferred
            .map(
              (destination) => AssistantLink(
                label: _localizedLabel(destination, l10n),
                destination: destination,
              ),
            )
            .toList(),
      );
    }

    return _ParsedAssistantResponse(text: cleaned.trim(), links: links);
  }

  AssistantDestination? _destinationFromTag(String? raw) {
    if (raw == null) return null;
    switch (raw.toLowerCase()) {
      case 'home':
        return AssistantDestination.home;
      case 'transactions':
        return AssistantDestination.transactions;
      case 'budget':
        return AssistantDestination.budget;
      case 'assistant':
        return AssistantDestination.assistant;
      case 'profile':
      case 'settings':
        return AssistantDestination.profile;
      default:
        return null;
    }
  }

  String _localizedLabel(
    AssistantDestination destination,
    AppLocalizations l10n,
  ) {
    switch (destination) {
      case AssistantDestination.home:
        return l10n.navHome;
      case AssistantDestination.transactions:
        return l10n.navTransactions;
      case AssistantDestination.budget:
        return l10n.navBudget;
      case AssistantDestination.assistant:
        return l10n.navAssistant;
      case AssistantDestination.profile:
        return l10n.navProfile;
    }
  }

  Set<AssistantDestination> _inferDestinations(String text) {
    final lower = text.toLowerCase();
    final matches = <AssistantDestination>{};
    if (lower.contains('transaction')) {
      matches.add(AssistantDestination.transactions);
    }
    if (lower.contains('budget') || lower.contains('envelope')) {
      matches.add(AssistantDestination.budget);
    }
    if (lower.contains('profile') || lower.contains('setting')) {
      matches.add(AssistantDestination.profile);
    }
    if (lower.contains('home') || lower.contains('dashboard')) {
      matches.add(AssistantDestination.home);
    }
    return matches;
  }

  void reset(AppLocalizations l10n) {
    _requestQueue = null;
    state = [
      AssistantMessage(
        text: l10n.assistantPlaceholder,
        fromUser: false,
        sentAt: DateTime.now(),
        links: const [],
      ),
    ];
  }
}

class _ParsedAssistantResponse {
  const _ParsedAssistantResponse({required this.text, required this.links});

  final String text;
  final List<AssistantLink> links;
}
