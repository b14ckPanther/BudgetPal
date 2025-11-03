import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_config.dart';
import '../../auth/application/user_profile_provider.dart';
import '../../categories/data/category_repository.dart';
import '../../categories/domain/budget_category.dart';
import '../domain/ai_transaction_suggestion.dart';
import '../domain/transaction_model.dart';

final transactionsAiServiceProvider = Provider<TransactionsAiService>((ref) {
  final dio = Dio(
    BaseOptions(
      headers: {'Content-Type': 'application/json'},
      connectTimeout: const Duration(seconds: 12),
      receiveTimeout: const Duration(seconds: 30),
    ),
  );
  return TransactionsAiService(dio: dio, ref: ref);
});

class TransactionsAiService {
  TransactionsAiService({required Dio dio, required Ref ref})
    : _dio = dio,
      _ref = ref;

  final Dio _dio;
  final Ref _ref;

  Future<List<AiTransactionSuggestion>> processInvoice({
    required String base64Image,
    String? locale,
  }) async {
    final user = _ref.read(authUserProvider);
    if (user == null) {
      return const [];
    }
    final categoriesRepository = _ref.read(categoryRepositoryProvider);
    final categories = await categoriesRepository.fetchCategories(user.uid);

    if (categories.isEmpty) {
      return const [];
    }

    if (aiInvoiceFunctionUrl.isNotEmpty) {
      return _callCustomFunction(base64Image, categories);
    }

    final provider = _resolveProvider(invoiceAiProvider);
    if (provider == _InvoiceAiProvider.knowledgeBase) {
      return _fallbackSuggestions(categories);
    }

    if (provider == _InvoiceAiProvider.openAi && openAiApiKey.isEmpty) {
      return _fallbackSuggestions(categories);
    }

    if (provider == _InvoiceAiProvider.gemini && geminiApiKey.isEmpty) {
      return _fallbackSuggestions(categories);
    }

    try {
      final language = locale ?? 'en';
      final raw = switch (provider) {
        _InvoiceAiProvider.openAi => await _callOpenAiInvoice(
          base64Image: base64Image,
          categories: categories,
          locale: language,
        ),
        _InvoiceAiProvider.gemini => await _callGeminiInvoice(
          base64Image: base64Image,
          categories: categories,
          locale: language,
        ),
        _InvoiceAiProvider.knowledgeBase => null,
      };

      if (raw == null || raw.trim().isEmpty) {
        return const [];
      }

      final suggestions = _decodeSuggestions(
        rawResponse: raw,
        categories: categories,
      );

      if (suggestions.isNotEmpty) {
        return suggestions;
      }
    } on DioException {
      return const [];
    } catch (_) {
      return const [];
    }

    return const [];
  }

  Future<List<AiTransactionSuggestion>> _callCustomFunction(
    String base64Image,
    List<BudgetCategory> categories,
  ) async {
    final payload = {
      'image': base64Image,
      'categories': categories
          .map(
            (category) => {
              'id': category.id,
              'name': category.name,
              'type': categoryTypeToString(category.type),
            },
          )
          .toList(),
    };

    final response = await _dio.post(
      aiInvoiceFunctionUrl,
      data: jsonEncode(payload),
    );

    final data = response.data;
    if (data is Map<String, dynamic>) {
      final items = data['transactions'];
      if (items is List) {
        return items
            .whereType<Map<String, dynamic>>()
            .map(AiTransactionSuggestion.fromJson)
            .toList();
      }
    }

    return const [];
  }

  List<AiTransactionSuggestion> _fallbackSuggestions(
    List<BudgetCategory> categories,
  ) {
    if (categories.isEmpty) {
      return const [];
    }

    final category = categories.first;
    return [
      AiTransactionSuggestion(
        amount: 120.0,
        categoryId: category.id,
        type: category.isIncome
            ? TransactionType.income
            : TransactionType.expense,
        transactionDate: DateTime.now(),
        merchant: 'Sample Merchant',
        note: 'AI suggestion placeholder',
      ),
    ];
  }

  _InvoiceAiProvider _resolveProvider(String raw) {
    final normalized = raw.trim().toLowerCase();
    switch (normalized) {
      case 'openai':
      case 'open_ai':
      case 'open-ai':
        return _InvoiceAiProvider.openAi;
      case 'gemini':
      case 'google':
      case 'google-gemini':
        return _InvoiceAiProvider.gemini;
      case 'knowledge':
      case 'kb':
      case 'knowledge_base':
      case 'knowledge-base':
      default:
        return _InvoiceAiProvider.knowledgeBase;
    }
  }

  Future<String?> _callOpenAiInvoice({
    required String base64Image,
    required List<BudgetCategory> categories,
    required String locale,
  }) async {
    final payload = {
      'model': openAiVisionModel,
      'messages': [
        {
          'role': 'system',
          'content': [
            {'type': 'text', 'text': _invoiceSystemPrompt(locale)},
          ],
        },
        {
          'role': 'user',
          'content': [
            {'type': 'text', 'text': _invoiceUserPrompt(categories, locale)},
            {
              'type': 'image_url',
              'image_url': {'url': 'data:image/jpeg;base64,$base64Image'},
            },
          ],
        },
      ],
      'temperature': 0.1,
    };

    final response = await _dio.post<Map<String, dynamic>>(
      'https://api.openai.com/v1/chat/completions',
      data: payload,
      options: Options(headers: {'Authorization': 'Bearer $openAiApiKey'}),
    );

    return _extractOpenAiContent(response.data);
  }

  Future<String?> _callGeminiInvoice({
    required String base64Image,
    required List<BudgetCategory> categories,
    required String locale,
  }) async {
    final payload = {
      'systemInstruction': {
        'parts': [
          {'text': _invoiceSystemPrompt(locale)},
        ],
      },
      'contents': [
        {
          'role': 'user',
          'parts': [
            {'text': _invoiceUserPrompt(categories, locale)},
            {
              'inlineData': {'mimeType': 'image/jpeg', 'data': base64Image},
            },
          ],
        },
      ],
      'generationConfig': {'temperature': 0.1},
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
            final buffer = StringBuffer();
            for (final part in parts) {
              if (part is Map<String, dynamic>) {
                final text = part['text'];
                if (text is String) {
                  buffer.write(text);
                }
              }
            }
            final result = buffer.toString().trim();
            if (result.isNotEmpty) {
              return result;
            }
          }
        }
      }
    }
    return null;
  }

  String? _extractOpenAiContent(Map<String, dynamic>? data) {
    if (data == null) return null;
    final choices = data['choices'];
    if (choices is List && choices.isNotEmpty) {
      final first = choices.first;
      if (first is Map<String, dynamic>) {
        final message = first['message'];
        if (message is Map<String, dynamic>) {
          final content = message['content'];
          if (content is String && content.trim().isNotEmpty) {
            return content.trim();
          }
          if (content is List && content.isNotEmpty) {
            final buffer = StringBuffer();
            for (final block in content) {
              if (block is Map<String, dynamic>) {
                final text = block['text'] ?? block['content'];
                if (text is String) {
                  buffer.write(text);
                }
              }
            }
            final result = buffer.toString().trim();
            if (result.isNotEmpty) {
              return result;
            }
          }
        }
      }
    }
    return null;
  }

  String _invoiceSystemPrompt(String locale) {
    final languageInstruction = _languageInstruction(locale);
    return '''
You extract structured transaction data from invoice images for the BudgetPal finance app. Always respond with strict JSON formatted as {"transactions":[{"amount":number,"categoryId":"existing-category-id","type":"expense|income","transactionDate":"YYYY-MM-DD","merchant":"optional","note":"optional"}]}.
- Use the provided category catalog and choose the best fitting categoryId.
- Guess the transaction date from the invoice (fallback to today's date in the user's locale if unclear).
- Amounts must be numbers using a dot decimal separator.
- When uncertain, make a reasonable guess instead of leaving fields empty.
$languageInstruction''';
  }

  String _invoiceUserPrompt(List<BudgetCategory> categories, String locale) {
    final buffer = StringBuffer()
      ..writeln('Invoice language: $locale')
      ..writeln('Category catalog (id => name | type):');
    for (final category in categories) {
      buffer.writeln(
        '${category.id} => ${category.name} | ${categoryTypeToString(category.type)}',
      );
    }
    buffer.writeln(
      'Extract every billable item as a single transaction. Prefer expense categories unless the amount is clearly income.',
    );
    return buffer.toString();
  }

  List<AiTransactionSuggestion> _decodeSuggestions({
    required String rawResponse,
    required List<BudgetCategory> categories,
  }) {
    final cleaned = rawResponse
        .replaceAll('```json', '')
        .replaceAll('```', '')
        .trim();
    dynamic decoded;
    try {
      decoded = jsonDecode(cleaned);
    } catch (_) {
      final extracted = _extractJsonObject(cleaned);
      if (extracted == null) {
        return const [];
      }
      try {
        decoded = jsonDecode(extracted);
      } catch (_) {
        return const [];
      }
    }

    if (decoded is List) {
      decoded = <String, dynamic>{'transactions': decoded};
    }
    if (decoded is! Map<String, dynamic>) {
      return const [];
    }
    final items = decoded['transactions'] ?? decoded['items'];
    if (items is! List) {
      return const [];
    }

    final catById = {for (final category in categories) category.id: category};
    final catByName = {
      for (final category in categories) category.name.toLowerCase(): category,
    };

    final suggestions = <AiTransactionSuggestion>[];
    for (final item in items) {
      if (item is! Map<String, dynamic>) continue;
      final normalized = Map<String, dynamic>.from(item);

      final amount = _parseAmount(normalized['amount']);
      if (amount == null || amount <= 0) {
        continue;
      }

      final rawCategoryId = normalized['categoryId'] as String?;
      final rawCategoryName = normalized['categoryName'] as String?;
      final rawCategory = normalized['category'] as String?;

      BudgetCategory? category;
      if (rawCategoryId != null && catById.containsKey(rawCategoryId)) {
        category = catById[rawCategoryId];
      } else if (rawCategoryName != null) {
        category = catByName[rawCategoryName.toLowerCase()];
      } else if (rawCategory != null) {
        category = catByName[rawCategory.toLowerCase()];
      }

      category ??= catByName[rawCategoryId?.toLowerCase() ?? ''];
      category ??= categories.isNotEmpty ? categories.first : null;
      if (category == null) {
        continue;
      }

      normalized['categoryId'] = category.id;
      final rawType = (normalized['type'] as String?)?.toLowerCase();
      final resolvedType = switch (rawType) {
        'income' => 'income',
        'expense' => 'expense',
        _ => category.isIncome ? 'income' : 'expense',
      };
      normalized['type'] = resolvedType;

      final dateString = normalized['transactionDate'] as String?;
      DateTime? parsedDate;
      if (dateString != null) {
        parsedDate = DateTime.tryParse(dateString);
        parsedDate ??= DateTime.tryParse(dateString.replaceAll('/', '-'));
      }
      parsedDate ??= DateTime.now();
      normalized['transactionDate'] = parsedDate.toIso8601String();

      suggestions.add(AiTransactionSuggestion.fromJson(normalized));
    }
    return suggestions;
  }

  String _languageInstruction(String locale) {
    final normalized = locale.toLowerCase();
    if (normalized.startsWith('ar')) {
      return 'Respond in Modern Standard Arabic when presenting notes or merchants.';
    }
    if (normalized.startsWith('he')) {
      return 'Respond in Hebrew when presenting notes or merchants.';
    }
    return 'Respond in English when presenting notes or merchants.';
  }

  String? _extractJsonObject(String raw) {
    final braceMatch = RegExp(r'\{[\s\S]*\}').firstMatch(raw);
    if (braceMatch != null) {
      return braceMatch.group(0);
    }
    final arrayMatch = RegExp(r'\[[\s\S]*\]').firstMatch(raw);
    if (arrayMatch != null) {
      return '{"transactions":${arrayMatch.group(0)}}';
    }
    return null;
  }

  double? _parseAmount(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }
    if (value is String) {
      var sanitized = value.trim();
      if (sanitized.isEmpty) return null;
      sanitized = sanitized.replaceAll(RegExp(r'[^0-9,\.-]'), '');
      if (sanitized.isEmpty) return null;
      if (sanitized.contains(',') && !sanitized.contains('.')) {
        sanitized = sanitized.replaceAll(',', '.');
      } else {
        sanitized = sanitized.replaceAll(',', '');
      }
      return double.tryParse(sanitized);
    }
    return null;
  }
}

enum _InvoiceAiProvider { knowledgeBase, openAi, gemini }
