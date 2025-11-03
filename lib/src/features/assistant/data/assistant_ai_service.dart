import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_config.dart';
import '../domain/assistant_message.dart';

const _conversationLimit = 10;

enum AssistantAiStatus { knowledgeBase, success, providerMissing, failure }

enum AssistantAiProvider { knowledgeBase, openAi, gemini }

class AssistantAiResult {
  const AssistantAiResult({
    required this.status,
    required this.provider,
    this.answer,
  });

  final AssistantAiStatus status;
  final AssistantAiProvider provider;
  final String? answer;

  bool get hasAnswer => answer != null && answer!.trim().isNotEmpty;
}

final assistantAiServiceProvider = Provider<AssistantAiService>((ref) {
  final dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 12),
      receiveTimeout: const Duration(seconds: 30),
      headers: const {'Content-Type': 'application/json'},
    ),
  );
  return AssistantAiService(dio);
});

class AssistantAiService {
  AssistantAiService(this._dio);

  final Dio _dio;

  Future<AssistantAiResult> getAnswer({
    required String question,
    required List<AssistantMessage> history,
    required String locale,
  }) async {
    final provider = _resolveProvider(assistantAiProvider);

    if (provider == AssistantAiProvider.knowledgeBase) {
      return AssistantAiResult(
        status: AssistantAiStatus.knowledgeBase,
        provider: provider,
      );
    }

    try {
      switch (provider) {
        case AssistantAiProvider.openAi:
          if (openAiApiKey.isEmpty) {
            return AssistantAiResult(
              status: AssistantAiStatus.providerMissing,
              provider: provider,
            );
          }
          final answer = await _callOpenAi(history: history, locale: locale);
          if (answer != null && answer.trim().isNotEmpty) {
            return AssistantAiResult(
              status: AssistantAiStatus.success,
              provider: provider,
              answer: answer.trim(),
            );
          }
          break;
        case AssistantAiProvider.gemini:
          if (geminiApiKey.isEmpty) {
            return AssistantAiResult(
              status: AssistantAiStatus.providerMissing,
              provider: provider,
            );
          }
          final answer = await _callGemini(history: history, locale: locale);
          if (answer != null && answer.trim().isNotEmpty) {
            return AssistantAiResult(
              status: AssistantAiStatus.success,
              provider: provider,
              answer: answer.trim(),
            );
          }
          break;
        case AssistantAiProvider.knowledgeBase:
          // Handled above.
          break;
      }
    } on DioException {
      return AssistantAiResult(
        status: AssistantAiStatus.failure,
        provider: provider,
      );
    } catch (_) {
      return AssistantAiResult(
        status: AssistantAiStatus.failure,
        provider: provider,
      );
    }

    return AssistantAiResult(
      status: AssistantAiStatus.failure,
      provider: provider,
    );
  }

  AssistantAiProvider _resolveProvider(String raw) {
    final normalized = raw.trim().toLowerCase();
    switch (normalized) {
      case 'openai':
      case 'open_ai':
      case 'open-ai':
        return AssistantAiProvider.openAi;
      case 'gemini':
      case 'google':
      case 'google-gemini':
        return AssistantAiProvider.gemini;
      case 'knowledge':
      case 'kb':
      case 'knowledge_base':
      case 'knowledge-base':
      default:
        return AssistantAiProvider.knowledgeBase;
    }
  }

  Future<String?> _callOpenAi({
    required List<AssistantMessage> history,
    required String locale,
  }) async {
    final messages = _buildOpenAiMessages(history, locale);
    final payload = {
      'model': openAiModel,
      'messages': messages,
      'temperature': 0.2,
    };

    final response = await _dio.post<Map<String, dynamic>>(
      'https://api.openai.com/v1/chat/completions',
      data: payload,
      options: Options(headers: {'Authorization': 'Bearer $openAiApiKey'}),
    );

    final data = response.data;
    if (data == null) {
      return null;
    }
    final choices = data['choices'];
    if (choices is List && choices.isNotEmpty) {
      final first = choices.first;
      if (first is Map<String, dynamic>) {
        final message = first['message'];
        if (message is Map<String, dynamic>) {
          final content = message['content'];
          if (content is String && content.trim().isNotEmpty) {
            return content;
          }
        }
      }
    }
    return null;
  }

  Future<String?> _callGemini({
    required List<AssistantMessage> history,
    required String locale,
  }) async {
    final contents = _buildGeminiContents(history);
    final payload = {
      'systemInstruction': {
        'parts': [
          {'text': _systemPrompt(locale)},
        ],
      },
      'contents': contents,
      'generationConfig': {'temperature': 0.2},
    };

    final response = await _dio.post<Map<String, dynamic>>(
      'https://generativelanguage.googleapis.com/v1beta/models/$geminiModel:generateContent',
      queryParameters: {'key': geminiApiKey},
      data: payload,
    );

    final data = response.data;
    if (data == null) {
      return null;
    }

    final candidates = data['candidates'];
    if (candidates is List && candidates.isNotEmpty) {
      final first = candidates.first;
      if (first is Map<String, dynamic>) {
        final content = first['content'];
        if (content is Map<String, dynamic>) {
          final parts = content['parts'];
          if (parts is List && parts.isNotEmpty) {
            final part = parts.first;
            if (part is Map<String, dynamic>) {
              final text = part['text'];
              if (text is String && text.trim().isNotEmpty) {
                return text;
              }
            }
          }
        }
      }
    }
    return null;
  }

  List<Map<String, dynamic>> _buildOpenAiMessages(
    List<AssistantMessage> history,
    String locale,
  ) {
    final trimmed = _recentHistory(history);
    final messages = <Map<String, dynamic>>[
      {'role': 'system', 'content': _systemPrompt(locale)},
    ];
    for (final message in trimmed) {
      messages.add({
        'role': message.fromUser ? 'user' : 'assistant',
        'content': message.text,
      });
    }
    return messages;
  }

  List<Map<String, dynamic>> _buildGeminiContents(
    List<AssistantMessage> history,
  ) {
    final trimmed = _recentHistory(history);
    return trimmed
        .map(
          (message) => {
            'role': message.fromUser ? 'user' : 'model',
            'parts': [
              {'text': message.text},
            ],
          },
        )
        .toList();
  }

  List<AssistantMessage> _recentHistory(List<AssistantMessage> history) {
    if (history.length <= _conversationLimit) {
      return history;
    }
    return history.sublist(history.length - _conversationLimit);
  }

  String _systemPrompt(String locale) {
    final languageInstruction = _languageInstruction(locale);
    return '''
You are BudgetPal, a multilingual personal finance assistant embedded inside a mobile app. Focus on explaining and guiding users through BudgetPal features such as budgets, transactions, invoice import, analytics, and settings. Politely refuse requests that are unrelated to the product and steer the user back to in-app workflows.
$languageInstruction
When you mention a tab that users can open, append a markdown navigation link using nav://home, nav://transactions, nav://budget, nav://assistant, or nav://profile (for example: [View Transactions](nav://transactions)).
Keep replies friendly, encouraging, and pragmatic. Use concise paragraphs or short bullet lists when helpful, and limit answers to roughly six sentences at most. Suggest concrete next steps inside the app whenever possible.''';
  }

  String _languageInstruction(String locale) {
    final normalized = locale.toLowerCase();
    if (normalized.startsWith('ar')) {
      return 'Respond in Modern Standard Arabic.';
    }
    if (normalized.startsWith('he')) {
      return 'Respond in Hebrew.';
    }
    return 'Respond in English.';
  }
}
