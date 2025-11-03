import 'package:budgetpal/l10n/app_localizations.dart';

typedef _AnswerBuilder = String Function(AppLocalizations l10n);

class AssistantKnowledgeBase {
  static final List<_AssistantEntry> _entries = [
    _AssistantEntry(
      keywords: ['transaction', 'spend', 'income', 'add'],
      answer: (l10n) =>
          'To add a new transaction, open the Transactions tab and tap “${l10n.transactionsAddButton}”. Fill the amount, choose a category, and save. '
          'You can also edit or delete any transaction from the list.',
    ),
    _AssistantEntry(
      keywords: ['budget', 'envelope', 'category'],
      answer: (l10n) =>
          'Budgets are organized by categories (“Needs”, “Wants”, “Loans”, and “Income”). '
          'Use the Budget tab to review allocation, remaining funds, and edit categories. '
          'Tap “${l10n.budgetAddCategory}” to create a new envelope or adjust targets.',
    ),
    _AssistantEntry(
      keywords: ['invoice', 'ai', 'import'],
      answer: (l10n) =>
          'The AI invoice import lives in the Transactions tab. Tap “${l10n.transactionsImportInvoice}” to capture or upload an invoice. '
          'We process the image, suggest transactions, and you can open a suggestion to review before saving.',
    ),
    _AssistantEntry(
      keywords: ['profile', 'settings', 'language', 'theme'],
      answer: (l10n) =>
          'Visit the Profile tab to update bank balance, overdraft limit, theme, and language. '
          'You can also send yourself a password reset email or sign out safely from there.',
    ),
    _AssistantEntry(
      keywords: ['home', 'dashboard', 'overview'],
      answer: (l10n) =>
          'The Home dashboard shows quick stats: income received, expense spending, available to budget, breakdown by category group, and the most recent transactions. '
          'Pull to refresh the data at any time.',
    ),
    _AssistantEntry(
      keywords: ['ai', 'assistant', 'help'],
      answer: (l10n) =>
          'I can help with BudgetPal features—budgets, transactions, AI invoice import, and profile settings. '
          'Let me know which part of the app you want guidance on.',
    ),
  ];

  static String responseFor(String rawQuestion, AppLocalizations l10n) {
    final question = rawQuestion.toLowerCase();
    for (final entry in _entries) {
      if (entry.matches(question)) {
        return entry.answer(l10n);
      }
    }
    return l10n.assistantCannotAnswer;
  }
}

class _AssistantEntry {
  _AssistantEntry({required this.keywords, required this.answer});

  final List<String> keywords;
  final _AnswerBuilder answer;

  bool matches(String question) {
    return keywords.any(question.contains);
  }
}
