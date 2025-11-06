import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import 'package:budgetpal/l10n/app_localizations.dart';

import '../../../core/formatters/app_currency_formatter.dart';
import '../../../core/telemetry/analytics_service.dart';
import '../../../core/widgets/app_error_view.dart';
import '../../../core/widgets/app_progress_indicator.dart';
import '../../../core/widgets/glass_backdrop.dart';
import '../../../core/widgets/glass_panel.dart';
import '../../categories/domain/budget_category.dart';
import '../application/transactions_providers.dart';
import '../data/transactions_ai_service.dart';
import '../domain/transaction_draft.dart';
import '../domain/transaction_model.dart';
import 'widgets/transaction_form_sheet.dart';
import 'widgets/transaction_list_tile.dart';

class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  final _searchController = TextEditingController();
  Timer? _debounce;
  bool _aiProcessing = false;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController
      ..removeListener(_onSearchChanged)
      ..dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), () {
      ref
          .read(transactionFiltersProvider.notifier)
          .setSearchQuery(_searchController.text);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final transactionsAsync = ref.watch(transactionsFilteredProvider);
    final categoriesAsync = ref.watch(categoriesStreamProvider);
    final filters = ref.watch(transactionFiltersProvider);

    final categories = categoriesAsync.value ?? const <BudgetCategory>[];
    final categoryMap = {
      for (final category in categories) category.id: category,
    };

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
                  _TransactionsHeader(
                    title: l10n.transactionsTitle,
                    subtitle: l10n.transactionsSubtitle,
                    onAdd: () {
                      _openTransactionForm();
                    },
                    onImportInvoice: categories.isEmpty
                        ? null
                        : () {
                            _startInvoiceImport();
                          },
                    aiProcessing: _aiProcessing,
                  ),
                  const SizedBox(height: 20),
                  _TransactionsFilters(
                    searchController: _searchController,
                    filters: filters,
                    categories: categories,
                    onClear: () =>
                        ref.read(transactionFiltersProvider.notifier).clear(),
                    onCategorySelected: (value) => ref
                        .read(transactionFiltersProvider.notifier)
                        .setCategory(value),
                    onTypeSelected: (type) => ref
                        .read(transactionFiltersProvider.notifier)
                        .setType(type),
                  ),
                  const SizedBox(height: 20),
                  Expanded(
                    child: _TransactionsFeed(
                      transactionsAsync: transactionsAsync,
                      l10n: l10n,
                      onRefresh: () async {
                        ref.invalidate(transactionsStreamProvider);
                      },
                      onAdd: () {
                        _openTransactionForm();
                      },
                      groupByDay: _groupByDay,
                      labelResolver: (key) =>
                          _labelForGroup(context, l10n, key),
                      categoryResolver: categoryMap,
                      onEdit: (transaction) => _openTransactionForm(
                        initial: TransactionDraft.fromModel(transaction),
                      ),
                      onDelete: (transaction) =>
                          _confirmDeleteTransaction(transaction, l10n),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<_TransactionDayGroup> _groupByDay(List<TransactionModel> items) {
    final groups = <String, List<TransactionModel>>{};

    for (final transaction in items) {
      final key = DateUtils.dateOnly(
        transaction.transactionDate,
      ).toIso8601String();
      groups.putIfAbsent(key, () => []).add(transaction);
    }

    final sortedKeys = groups.keys.toList()..sort((a, b) => b.compareTo(a));

    return sortedKeys
        .map(
          (key) => _TransactionDayGroup(label: key, transactions: groups[key]!),
        )
        .toList();
  }

  String _labelForGroup(
    BuildContext context,
    AppLocalizations l10n,
    String key,
  ) {
    final date = DateTime.tryParse(key);
    if (date == null) return key;

    final today = DateUtils.dateOnly(DateTime.now());
    final yesterday = DateUtils.addDaysToDate(today, -1);

    if (date == today) return l10n.transactionsDateToday;
    if (date == yesterday) return l10n.transactionsDateYesterday;
    return l10n.transactionsDateEarlier;
  }

  Future<void> _openTransactionForm({TransactionDraft? initial}) {
    return showTransactionFormSheet(context, ref, initialDraft: initial);
  }

  Future<void> _confirmDeleteTransaction(
    TransactionModel transaction,
    AppLocalizations l10n,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.transactionDeleteConfirmTitle),
        content: Text(l10n.transactionDeleteConfirmMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(l10n.transactionDeleteConfirmCancel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(l10n.transactionDeleteConfirmConfirm),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref
          .read(transactionsControllerProvider.notifier)
          .remove(transaction.id, transaction: transaction);
    }
  }

  Future<({XFile file, ImageSource source})?> _pickInvoiceImage(
    AnalyticsService telemetry,
  ) async {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      useRootNavigator: true,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_camera_outlined),
                title: Text(l10n.transactionsImportCamera),
                onTap: () => Navigator.of(context).pop(ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: Text(l10n.transactionsImportGallery),
                onTap: () => Navigator.of(context).pop(ImageSource.gallery),
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
      backgroundColor: theme.colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
    );

    if (source == null) {
      await telemetry.logInvoiceImport(
        source: 'none',
        success: false,
        errorCode: 'picker_dismissed',
      );
      return null;
    }

    final picker = ImagePicker();
    try {
      final result = await picker.pickImage(source: source, imageQuality: 85);
      if (result == null) {
        await telemetry.logInvoiceImport(
          source: source.name,
          success: false,
          errorCode: 'user_cancelled',
        );
        return null;
      }
      return (file: result, source: source);
    } on PlatformException catch (_) {
      if (!mounted) return null;
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(SnackBar(content: Text(l10n.transactionsAiPickError)));
      await telemetry.logInvoiceImport(
        source: source.name,
        success: false,
        errorCode: 'platform_exception',
      );
      return null;
    }
  }

  Future<void> _startInvoiceImport() async {
    final telemetry = ref.read(analyticsServiceProvider);
    final l10n = AppLocalizations.of(context);
    final picked = await _pickInvoiceImage(telemetry);
    if (picked == null) return;
    final image = picked.file;
    final source = picked.source;

    setState(() {
      _aiProcessing = true;
    });

    try {
      final bytes = await image.readAsBytes();
      final base64Image = base64Encode(bytes);
      final service = ref.read(transactionsAiServiceProvider);
      final suggestions = await service.processInvoice(
        base64Image: base64Image,
        locale: l10n.localeName,
      );

      if (!mounted) return;

      final drafts = suggestions
          .map((suggestion) => suggestion.toDraft())
          .toList();

      if (drafts.isEmpty) {
        await telemetry.logInvoiceImport(
          source: source.name,
          success: true,
          suggestions: 0,
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context)
          ..clearSnackBars()
          ..showSnackBar(SnackBar(content: Text(l10n.transactionsAiNoResults)));
        return;
      }

      await telemetry.logInvoiceImport(
        source: source.name,
        success: true,
        suggestions: drafts.length,
      );
      if (!mounted) return;

      final selectedDraft = await showModalBottomSheet<TransactionDraft?>(
        context: context,
        isScrollControlled: true,
        builder: (sheetContext) {
          return _AiSuggestionsSheet(
            suggestions: drafts,
            onSuggestionTap: (draft) {
              Navigator.of(sheetContext).pop(draft);
            },
          );
        },
      );
      if (!mounted || selectedDraft == null) {
        return;
      }
      if (selectedDraft.categoryId.isEmpty || selectedDraft.amount <= 0) {
        await _openTransactionForm(initial: selectedDraft);
        return;
      }
      final controller = ref.read(transactionsControllerProvider.notifier);
      final success = await controller.create(selectedDraft);
      if (!mounted) {
        return;
      }
      if (success) {
        ScaffoldMessenger.of(context)
          ..clearSnackBars()
          ..showSnackBar(
            SnackBar(content: Text(l10n.transactionsAiAppliedSuccess)),
          );
        return;
      }
      await _openTransactionForm(initial: selectedDraft);
    } catch (error) {
      if (!mounted) return;
      final l10n = AppLocalizations.of(context);
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(
          SnackBar(
            content: Text(error.toString()),
            action: SnackBarAction(
              label: l10n.retryButtonLabel,
              onPressed: _startInvoiceImport,
            ),
          ),
        );
      await telemetry.logInvoiceImport(
        source: source.name,
        success: false,
        errorCode: error.runtimeType.toString(),
      );
    } finally {
      if (mounted) {
        setState(() {
          _aiProcessing = false;
        });
      }
    }
  }
}

class _TransactionsHeader extends StatelessWidget {
  const _TransactionsHeader({
    required this.title,
    required this.subtitle,
    required this.onAdd,
    required this.onImportInvoice,
    required this.aiProcessing,
  });

  final String title;
  final String subtitle;
  final VoidCallback onAdd;
  final VoidCallback? onImportInvoice;
  final bool aiProcessing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return GlassPanel(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            softWrap: false,
          ),
          const SizedBox(height: 6),
          Text(subtitle, style: theme.textTheme.bodyLarge),
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton.icon(
                onPressed: onAdd,
                icon: const Icon(Icons.add),
                label: Text(l10n.transactionsAddButton),
              ),
              OutlinedButton.icon(
                onPressed: aiProcessing ? null : onImportInvoice,
                icon: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: aiProcessing
                      ? const SizedBox(
                          key: ValueKey('transactions_ai_spinner'),
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(
                          Icons.document_scanner_outlined,
                          key: ValueKey('transactions_ai_icon'),
                        ),
                ),
                label: Text(
                  aiProcessing
                      ? l10n.transactionsAiProcessing
                      : l10n.transactionsImportInvoice,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TransactionsFilters extends StatelessWidget {
  const _TransactionsFilters({
    required this.searchController,
    required this.filters,
    required this.categories,
    required this.onClear,
    required this.onCategorySelected,
    required this.onTypeSelected,
  });

  final TextEditingController searchController;
  final TransactionFilters filters;
  final List<BudgetCategory> categories;
  final VoidCallback onClear;
  final ValueChanged<String?> onCategorySelected;
  final ValueChanged<TransactionType?> onTypeSelected;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final selection = filters.type != null
        ? {filters.type!}
        : <TransactionType>{};

    return GlassPanel(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: searchController,
                  decoration: InputDecoration(
                    hintText: l10n.transactionsSearchHint,
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              TextButton.icon(
                onPressed: filters.hasFilters ? onClear : null,
                icon: const Icon(Icons.close_rounded),
                label: Text(l10n.transactionsFilterReset),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              SegmentedButton<TransactionType>(
                segments: [
                  ButtonSegment(
                    value: TransactionType.expense,
                    label: Text(l10n.transactionTypeExpense),
                    icon: const Icon(Icons.arrow_downward_rounded),
                  ),
                  ButtonSegment(
                    value: TransactionType.income,
                    label: Text(l10n.transactionTypeIncome),
                    icon: const Icon(Icons.arrow_upward_rounded),
                  ),
                ],
                style: ButtonStyle(visualDensity: VisualDensity.compact),
                emptySelectionAllowed: true,
                selected: selection,
                onSelectionChanged: (values) {
                  onTypeSelected(values.isEmpty ? null : values.first);
                },
              ),
              SizedBox(
                width: 240,
                child: DropdownButtonFormField<String?>(
                  initialValue: filters.categoryId,
                  decoration: InputDecoration(
                    labelText: l10n.transactionFormCategoryLabel,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  items: [
                    DropdownMenuItem<String?>(
                      value: null,
                      child: Text(l10n.transactionsFilterReset),
                    ),
                    ...categories.map(
                      (category) => DropdownMenuItem(
                        value: category.id,
                        child: Text(category.name),
                      ),
                    ),
                  ],
                  onChanged: onCategorySelected,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TransactionsFeed extends StatelessWidget {
  const _TransactionsFeed({
    required this.transactionsAsync,
    required this.l10n,
    required this.onRefresh,
    required this.onAdd,
    required this.groupByDay,
    required this.labelResolver,
    required this.categoryResolver,
    required this.onEdit,
    required this.onDelete,
  });

  final AsyncValue<List<TransactionModel>> transactionsAsync;
  final AppLocalizations l10n;
  final Future<void> Function() onRefresh;
  final VoidCallback onAdd;
  final List<_TransactionDayGroup> Function(List<TransactionModel>) groupByDay;
  final String Function(String key) labelResolver;
  final Map<String, BudgetCategory> categoryResolver;
  final ValueChanged<TransactionModel> onEdit;
  final ValueChanged<TransactionModel> onDelete;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      padding: EdgeInsets.zero,
      child: RefreshIndicator(
        onRefresh: onRefresh,
        child: transactionsAsync.when(
          data: (transactions) {
            if (transactions.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(24),
                children: [
                  _EmptyTransactions(
                    title: l10n.transactionsEmptyTitle,
                    subtitle: l10n.transactionsEmptySubtitle,
                    onAdd: onAdd,
                  ),
                ],
              );
            }

            final grouped = groupByDay(transactions);

            return ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 48),
              itemCount: grouped.length,
              itemBuilder: (context, index) {
                final group = grouped[index];
                return Padding(
                  padding: EdgeInsets.only(
                    bottom: index == grouped.length - 1 ? 12 : 24,
                  ),
                  child: _TransactionDaySection(
                    label: labelResolver(group.label),
                    transactions: group.transactions,
                    categoryResolver: categoryResolver,
                    onEdit: onEdit,
                    onDelete: onDelete,
                    editLabel: l10n.transactionFormUpdate,
                    deleteLabel: l10n.transactionFormDelete,
                  ),
                );
              },
            );
          },
          loading: () => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(24, 120, 24, 120),
            children: [
              Center(child: AppProgressIndicator(label: l10n.loadingLabel)),
            ],
          ),
          error: (error, stackTrace) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 120),
            children: [
              AppErrorView(
                title: l10n.unknownError,
                message: l10n.genericLoadError,
                details: error.toString(),
                retryLabel: l10n.retryButtonLabel,
                onRetry: () => onRefresh(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyTransactions extends StatelessWidget {
  const _EmptyTransactions({
    required this.title,
    required this.subtitle,
    required this.onAdd,
  });

  final String title;
  final String subtitle;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: 320,
                      child: Text(
                        subtitle,
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: onAdd,
                      child: Text(l10n.transactionsAddButton),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _TransactionDayGroup {
  _TransactionDayGroup({required this.label, required this.transactions});

  final String label;
  final List<TransactionModel> transactions;
}

class _TransactionDaySection extends StatelessWidget {
  const _TransactionDaySection({
    required this.label,
    required this.transactions,
    required this.categoryResolver,
    required this.onEdit,
    required this.onDelete,
    required this.editLabel,
    required this.deleteLabel,
  });

  final String label;
  final List<TransactionModel> transactions;
  final Map<String, BudgetCategory> categoryResolver;
  final ValueChanged<TransactionModel> onEdit;
  final ValueChanged<TransactionModel> onDelete;
  final String editLabel;
  final String deleteLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        ...transactions.map(
          (transaction) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: TransactionListTile(
              transaction: transaction,
              category: categoryResolver[transaction.categoryId],
              onEdit: () => onEdit(transaction),
              onDelete: () => onDelete(transaction),
              editLabel: editLabel,
              deleteLabel: deleteLabel,
            ),
          ),
        ),
      ],
    );
  }
}

class _AiSuggestionsSheet extends StatelessWidget {
  const _AiSuggestionsSheet({
    required this.suggestions,
    required this.onSuggestionTap,
  });

  final List<TransactionDraft> suggestions;
  final ValueChanged<TransactionDraft> onSuggestionTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  l10n.transactionsAiResultTitle,
                  style: theme.textTheme.titleLarge,
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.of(context).maybePop(),
                  icon: const Icon(Icons.close),
                  tooltip: l10n.closeButtonTooltip,
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: (suggestions.length.clamp(1, 4) * 96).toDouble(),
              child: ListView.separated(
                itemCount: suggestions.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final suggestion = suggestions[index];
                  final locale = Localizations.localeOf(context);
                  final formattedAmount = AppCurrencyFormatter.format(
                    suggestion.amount,
                    locale: locale,
                  );
                  return Card(
                    child: InkWell(
                      onTap: () => onSuggestionTap(suggestion),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              formattedAmount,
                              style: theme.textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            if (suggestion.merchant != null)
                              Text(
                                suggestion.merchant!,
                                style: theme.textTheme.bodyMedium,
                              ),
                            if (suggestion.note != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  suggestion.note!,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ),
                            const SizedBox(height: 12),
                            Align(
                              alignment: Alignment.centerRight,
                              child: Text(
                                l10n.transactionsAiResultApply,
                                style: theme.textTheme.labelLarge?.copyWith(
                                  color: theme.colorScheme.primary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
