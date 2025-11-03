import 'package:flutter/material.dart';

import '../../../categories/domain/budget_category.dart';
import '../../application/budget_providers.dart';
import 'budget_envelope_card.dart';

class BudgetSection extends StatelessWidget {
  const BudgetSection({
    super.key,
    required this.group,
    required this.sectionLabel,
    required this.categoryLabelResolver,
    required this.labels,
    required this.onEdit,
    required this.onDelete,
  });

  final BudgetGroup group;
  final String sectionLabel;
  final String Function(CategoryType type) categoryLabelResolver;
  final BudgetSectionLabels labels;
  final void Function(BudgetEnvelope envelope) onEdit;
  final void Function(BudgetEnvelope envelope) onDelete;

  @override
  Widget build(BuildContext context) {
    if (group.envelopes.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          sectionLabel,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 12),
        Column(
          children: group.envelopes
              .map(
                (envelope) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: BudgetEnvelopeCard(
                    envelope: envelope,
                    categoryLabel:
                        categoryLabelResolver(envelope.category.type),
                    budgetedLabel: labels.budgeted,
                    spentLabel: envelope.category.isIncome
                        ? labels.incomeReceived
                        : labels.spent,
                    remainingLabel: envelope.category.isIncome
                        ? labels.incomeRemaining
                        : labels.expenseRemaining,
                    editLabel: labels.edit,
                    deleteLabel: labels.delete,
                    onEdit: () => onEdit(envelope),
                    onDelete: () => onDelete(envelope),
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class BudgetSectionLabels {
  const BudgetSectionLabels({
    required this.budgeted,
    required this.spent,
    required this.incomeReceived,
    required this.incomeRemaining,
    required this.expenseRemaining,
    required this.edit,
    required this.delete,
  });

  final String budgeted;
  final String spent;
  final String incomeReceived;
  final String incomeRemaining;
  final String expenseRemaining;
  final String edit;
  final String delete;
}
