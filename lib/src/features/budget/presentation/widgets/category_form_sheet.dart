import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:budgetpal/l10n/app_localizations.dart';

import '../../../../core/formatters/app_currency_formatter.dart';
import '../../../categories/application/category_controller.dart';
import '../../../categories/domain/budget_category.dart';
import '../../../categories/domain/budget_category_draft.dart';

Future<void> showCategoryFormSheet(
  BuildContext context,
  WidgetRef ref, {
  BudgetCategoryDraft? draft,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) {
      return FractionallySizedBox(
        heightFactor: 0.85,
        child: _CategoryFormSheet(draft: draft),
      );
    },
  );
}

class _CategoryFormSheet extends ConsumerStatefulWidget {
  const _CategoryFormSheet({this.draft});

  final BudgetCategoryDraft? draft;

  @override
  ConsumerState<_CategoryFormSheet> createState() => _CategoryFormSheetState();
}

class _CategoryFormSheetState extends ConsumerState<_CategoryFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _targetController;
  CategoryType _type = CategoryType.need;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.draft?.name ?? '');
    _targetController = TextEditingController(
      text: widget.draft?.targetAmount.toStringAsFixed(2) ?? '',
    );
    _type = widget.draft?.type ?? CategoryType.need;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _targetController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    ref.listen<AsyncValue<void>>(categoryControllerProvider,
        (previous, next) {
      next.when(
        data: (_) {
          if (previous?.isLoading == true && mounted) {
            Navigator.of(context).maybePop();
          }
        },
        error: (error, stackTrace) {
          if (!mounted) {
            return;
          }
          ScaffoldMessenger.of(context)
            ..clearSnackBars()
            ..showSnackBar(
              SnackBar(content: Text(error.toString())),
            );
        },
        loading: () {},
      );
    });

    final controllerState = ref.watch(categoryControllerProvider);
    final isEditing = widget.draft?.id != null;
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
                  Expanded(
                    child: Text(
                      isEditing
                          ? l10n.budgetEditCategory
                          : l10n.budgetAddCategory,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.close),
                    tooltip: l10n.closeButtonTooltip,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: l10n.budgetCategoryNameLabel,
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return l10n.budgetCategoryNameLabel;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _targetController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: l10n.budgetCategoryTargetLabel,
                  prefixText: '${AppCurrencyFormatter.symbol} ',
                ),
                validator: (value) {
                  final amount = double.tryParse(value ?? '');
                  if (amount == null || amount <= 0) {
                    return l10n.budgetCategoryAmountError;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<CategoryType>(
                key: ValueKey(_type),
                initialValue: _type,
                decoration: InputDecoration(
                  labelText: l10n.budgetCategoryTypeLabel,
                ),
                items: CategoryType.values
                    .map(
                      (type) => DropdownMenuItem(
                        value: type,
                        child: Text(_labelForType(type, l10n)),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _type = value);
                  }
                },
              ),
              const Spacer(),
              Row(
                children: [
                  if (isEditing)
                    TextButton(
                      onPressed: controllerState.isLoading
                          ? null
                          : () => _confirmDelete(l10n),
                      child: Text(l10n.budgetCategoryDelete),
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
                                ? l10n.budgetCategoryUpdate
                                : l10n.budgetCategorySave,
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

    final draft = BudgetCategoryDraft(
      id: widget.draft?.id,
      name: _nameController.text.trim(),
      type: _type,
      targetAmount: double.tryParse(_targetController.text.trim()) ?? 0,
    );

    final controller = ref.read(categoryControllerProvider.notifier);
    if (widget.draft?.id == null) {
      await controller.createCategory(draft);
    } else {
      await controller.updateCategory(draft);
    }
  }

  Future<void> _confirmDelete(AppLocalizations l10n) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.budgetCategoryDeleteConfirmTitle),
        content: Text(l10n.budgetCategoryDeleteConfirmMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(l10n.budgetCategoryDeleteConfirmCancel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(l10n.budgetCategoryDeleteConfirmConfirm),
          ),
        ],
      ),
    );

    if (confirmed == true && widget.draft?.id != null) {
      final controller = ref.read(categoryControllerProvider.notifier);
      await controller.deleteCategory(
        widget.draft!.id!,
        type: widget.draft!.type,
      );
      if (!mounted) return;
      Navigator.of(context).maybePop();
    }
  }

  String _labelForType(CategoryType type, AppLocalizations l10n) {
    switch (type) {
      case CategoryType.need:
        return l10n.budgetCategoryTypeNeed;
      case CategoryType.want:
        return l10n.budgetCategoryTypeWant;
      case CategoryType.loan:
        return l10n.budgetCategoryTypeLoan;
      case CategoryType.income:
        return l10n.budgetCategoryTypeIncome;
    }
  }
}
