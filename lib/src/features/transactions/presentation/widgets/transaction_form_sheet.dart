import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:budgetpal/l10n/app_localizations.dart';
import 'package:firebase_core/firebase_core.dart';

import '../../../../core/formatters/app_currency_formatter.dart';
import '../../application/transactions_providers.dart';
import '../../domain/transaction_draft.dart';
import '../../domain/transaction_model.dart';

Future<void> showTransactionFormSheet(
  BuildContext context,
  WidgetRef ref, {
  TransactionDraft? initialDraft,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) {
      return FractionallySizedBox(
        heightFactor: 0.9,
        child: TransactionFormSheet(initialDraft: initialDraft),
      );
    },
  );
}

class TransactionFormSheet extends ConsumerStatefulWidget {
  const TransactionFormSheet({super.key, this.initialDraft});

  final TransactionDraft? initialDraft;

  @override
  ConsumerState<TransactionFormSheet> createState() =>
      _TransactionFormSheetState();
}

class _TransactionFormSheetState extends ConsumerState<TransactionFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _amountController;
  late final TextEditingController _noteController;
  late final TextEditingController _merchantController;

  TransactionType _type = TransactionType.expense;
  DateTime _transactionDate = DateTime.now();
  String? _categoryId;

  @override
  void initState() {
    super.initState();
    final draft = widget.initialDraft;
    _amountController = TextEditingController(
      text: draft != null ? draft.amount.toStringAsFixed(2) : '',
    );
    _noteController = TextEditingController(text: draft?.note ?? '');
    _merchantController = TextEditingController(text: draft?.merchant ?? '');
    _type = draft?.type ?? TransactionType.expense;
    _transactionDate = draft?.transactionDate ?? DateTime.now();
    _categoryId = draft?.categoryId;
  }

  @override
  void dispose() {
    _amountController.dispose();
    _noteController.dispose();
    _merchantController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    ref.listen<AsyncValue<void>>(transactionsControllerProvider, (
      previous,
      next,
    ) {
      if (!mounted) {
        return;
      }
      next.maybeWhen(
        error: (error, stackTrace) {
          ScaffoldMessenger.of(context)
            ..clearSnackBars()
            ..showSnackBar(SnackBar(content: Text(error.toString())));
        },
        orElse: () {},
      );
    });

    final categoriesAsync = ref.watch(categoriesStreamProvider);
    final controllerState = ref.watch(transactionsControllerProvider);
    final isEditing = widget.initialDraft?.id != null;

    final padding = MediaQuery.of(context).viewInsets;

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: padding.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    isEditing
                        ? l10n.transactionFormTitleEdit
                        : l10n.transactionFormTitleNew,
                    style: Theme.of(context).textTheme.titleLarge,
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
              TextFormField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: InputDecoration(
                  labelText: l10n.transactionFormAmountLabel,
                  prefixText: '${AppCurrencyFormatter.symbol} ',
                ),
                validator: (value) {
                  final parsed = double.tryParse(value ?? '');
                  if (parsed == null || parsed <= 0) {
                    return l10n.transactionFormAmountError;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              categoriesAsync.when(
                data: (categories) {
                  if (_categoryId == null && categories.isNotEmpty) {
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (mounted) {
                        setState(() {
                          _categoryId = categories.first.id;
                        });
                      }
                    });
                  }

                  if (categories.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text(
                        l10n.transactionsNoCategoriesHelper,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    );
                  }

                  return DropdownButtonFormField<String>(
                    key: ValueKey(_categoryId),
                    initialValue: _categoryId,
                    decoration: InputDecoration(
                      labelText: l10n.transactionFormCategoryLabel,
                    ),
                    items: categories
                        .map(
                          (category) => DropdownMenuItem<String>(
                            value: category.id,
                            child: Text(category.name),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        _categoryId = value;
                      });
                    },
                  );
                },
                loading: () => const LinearProgressIndicator(),
                error: (error, stackTrace) => Text(
                  error.toString(),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.error,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SegmentedButton<TransactionType>(
                segments: [
                  ButtonSegment(
                    value: TransactionType.expense,
                    label: Text(l10n.transactionTypeExpense),
                  ),
                  ButtonSegment(
                    value: TransactionType.income,
                    label: Text(l10n.transactionTypeIncome),
                  ),
                ],
                selected: {_type},
                onSelectionChanged: (selection) {
                  setState(() {
                    _type = selection.first;
                  });
                },
              ),
              const SizedBox(height: 16),
              InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _transactionDate,
                    firstDate: DateTime(2019),
                    lastDate: DateTime(2100),
                  );
                  if (picked != null) {
                    setState(() {
                      _transactionDate = picked;
                    });
                  }
                },
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: l10n.transactionFormDateLabel,
                  ),
                  child: Text(
                    '${_transactionDate.year}-${_transactionDate.month.toString().padLeft(2, '0')}-${_transactionDate.day.toString().padLeft(2, '0')}',
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _merchantController,
                decoration: InputDecoration(
                  labelText: l10n.transactionFormMerchantLabel,
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _noteController,
                minLines: 2,
                maxLines: 4,
                decoration: InputDecoration(
                  labelText: l10n.transactionFormNoteLabel,
                ),
              ),
              const Spacer(),
              Row(
                children: [
                  if (isEditing)
                    TextButton(
                      onPressed: controllerState.isLoading
                          ? null
                          : () => _confirmDelete(context, l10n),
                      child: Text(l10n.transactionFormDelete),
                    ),
                  const Spacer(),
                  FilledButton(
                    onPressed: controllerState.isLoading
                        ? null
                        : () => _submit(l10n),
                    child: controllerState.isLoading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(
                            isEditing
                                ? l10n.transactionFormUpdate
                                : l10n.transactionFormSave,
                          ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit(AppLocalizations l10n) async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    if (_categoryId == null || _categoryId!.isEmpty) {
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(
          SnackBar(
            content: Text(l10n.transactionsNoCategoriesHelper),
            duration: const Duration(seconds: 3),
          ),
        );
      return;
    }

    final amount = double.tryParse(_amountController.text.trim()) ?? 0;
    final draft = TransactionDraft(
      id: widget.initialDraft?.id,
      categoryId: _categoryId ?? widget.initialDraft?.categoryId ?? '',
      amount: amount,
      transactionDate: _transactionDate,
      type: _type,
      note: _noteController.text.trim().isEmpty
          ? null
          : _noteController.text.trim(),
      merchant: _merchantController.text.trim().isEmpty
          ? null
          : _merchantController.text.trim(),
    );

    final controller = ref.read(transactionsControllerProvider.notifier);
    bool success = false;
    if (widget.initialDraft == null) {
      success = await controller.create(draft);
    } else {
      success = await controller.update(draft);
    }

    if (!mounted) {
      return;
    }

    if (success) {
      Navigator.of(context).maybePop(true);
      return;
    }

    final controllerState = ref.read(transactionsControllerProvider);
    final error = controllerState.asError?.error;
    final message = _mapErrorMessage(error, l10n);

    if (!mounted) {
      return;
    }

    if (message != null && message.isNotEmpty) {
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(
          SnackBar(
            content: Text(message),
            duration: const Duration(seconds: 4),
          ),
        );
    }
  }

  String? _mapErrorMessage(Object? error, AppLocalizations l10n) {
    if (error == null) {
      return l10n.unknownError;
    }
    if (error is FirebaseException && error.message != null) {
      return error.message!.isNotEmpty ? error.message : l10n.unknownError;
    }
    return error.toString().isNotEmpty ? error.toString() : l10n.unknownError;
  }

  Future<void> _confirmDelete(
    BuildContext context,
    AppLocalizations l10n,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
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
        );
      },
    );

    if (!mounted) {
      return;
    }

    if (confirmed == true && widget.initialDraft?.id != null) {
      final controller = ref.read(transactionsControllerProvider.notifier);
      await controller.remove(
        widget.initialDraft!.id!,
        transaction: widget.initialDraft!.toModel().copyWith(
          id: widget.initialDraft!.id!,
        ),
      );
      if (!context.mounted) {
        return;
      }
      Navigator.of(context).maybePop();
    }
  }
}
