import 'package:flutter/material.dart';

import '../../../../core/formatters/app_currency_formatter.dart';
import '../../../categories/domain/budget_category.dart';
import '../../application/budget_providers.dart';

class BudgetEnvelopeCard extends StatelessWidget {
  const BudgetEnvelopeCard({
    super.key,
    required this.envelope,
    required this.categoryLabel,
    required this.budgetedLabel,
    required this.spentLabel,
    required this.remainingLabel,
    required this.editLabel,
    required this.deleteLabel,
    this.onEdit,
    this.onDelete,
  });

  final BudgetEnvelope envelope;
  final String categoryLabel;
  final String budgetedLabel;
  final String spentLabel;
  final String remainingLabel;
  final String editLabel;
  final String deleteLabel;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final category = envelope.category;

    Color chipColor;
    switch (category.type) {
      case CategoryType.need:
        chipColor = theme.colorScheme.primary;
        break;
      case CategoryType.want:
        chipColor = theme.colorScheme.secondary;
        break;
      case CategoryType.loan:
        chipColor = theme.colorScheme.error;
        break;
      case CategoryType.income:
        chipColor = theme.colorScheme.tertiary;
        break;
    }

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        category.name,
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Chip(
                        label: Text(categoryLabel),
                        visualDensity: VisualDensity.compact,
                        backgroundColor: chipColor.withValues(alpha: 0.12),
                        labelStyle: theme.textTheme.labelMedium?.copyWith(
                          color: chipColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  onSelected: (value) {
                    if (value == 'edit') {
                      onEdit?.call();
                    } else if (value == 'delete') {
                      onDelete?.call();
                    }
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(value: 'edit', child: Text(editLabel)),
                    PopupMenuItem(value: 'delete', child: Text(deleteLabel)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: envelope.progress,
              backgroundColor: theme.colorScheme.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation<Color>(
                envelope.isOverspent
                    ? theme.colorScheme.error
                    : chipColor,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _MetricTile(
                    label: budgetedLabel,
                    value: envelope.targetAmount,
                  ),
                ),
                Expanded(
                  child: _MetricTile(
                    label: spentLabel,
                    value: envelope.spentAmount,
                  ),
                ),
                Expanded(
                  child: _MetricTile(
                    label: remainingLabel,
                    value: envelope.remaining,
                    highlight: envelope.isOverspent,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  final String label;
  final double value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final locale = Localizations.localeOf(context);
    final formattedValue =
        AppCurrencyFormatter.format(value, locale: locale);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          formattedValue,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: highlight ? theme.colorScheme.error : null,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
