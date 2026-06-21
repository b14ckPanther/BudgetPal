/**
 * BudgetPal — Transaction Detail & Edit Screen
 * View, edit, and soft-delete a transaction with confirmation prompts.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar, ChevronDown, Trash2, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Screen, Text, Input, Button, Card } from '@/components/ui';
import { t } from '@/lib/i18n';
import { formatDate } from '@/lib/dates';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  useTransactions,
  useCategories,
  useCurrentBudget,
  useUpdateTransaction,
  useSoftDeleteTransaction,
} from '@/hooks/useBudgetQueries';
import { useFeedback, ScreenLoadingState } from '@/components/feedback';

type TxType = 'expense' | 'income' | 'transfer';

export default function TransactionDetailScreen() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { confirm, toast } = useFeedback();

  // Queries & Mutations
  const { data: txs, isLoading: isTxLoading } = useTransactions();
  const { data: categories, isLoading: isCatsLoading, isError: isCatsError, refetch: refetchCats } = useCategories();
  const { data: budget } = useCurrentBudget();
  const updateTxMutation = useUpdateTransaction();
  const deleteTxMutation = useSoftDeleteTransaction();

  // Find transaction
  const transaction = useMemo(() => {
    if (!txs || !id) return null;
    return txs.find((t) => t.id === id) || null;
  }, [txs, id]);

  // Form State
  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<{ id: string; name: string } | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // UI State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showSubcategorySelector, setShowSubcategorySelector] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState<Date>(new Date());

  const currency = budget?.currency || 'ILS';

  // Load transaction values into form state
  useEffect(() => {
    if (transaction) {
      setType(transaction.type as TxType);
      setAmount(String(transaction.amount));
      setMerchant(transaction.merchant || transaction.title || '');
      setDate(transaction.date ? new Date(transaction.date) : new Date());
      setNote(transaction.note || '');

      if (transaction.categoryId && categories) {
        const cat = categories.find((c) => c.id === transaction.categoryId);
        if (cat) {
          setSelectedCategory({ id: cat.id, name: cat.name });
        }
      }
      if (transaction.subcategoryId && categories) {
        const sub = categories.find((c) => c.id === transaction.subcategoryId);
        if (sub) {
          setSelectedSubcategory({ id: sub.id, name: sub.name });
        }
      }
    }
  }, [transaction, categories]);

  // Filter categories by selected type
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    const parents = categories.filter((c) => !c.parentCategoryId);

    if (type === 'expense') {
      return parents.filter((c) => c.type === 'expense');
    }
    if (type === 'income') {
      return parents.filter((c) => c.type === 'income');
    }
    if (type === 'transfer') {
      const matches = parents.filter((c) => c.type === 'transfer' || c.type === 'savings');
      if (matches.length > 0) return matches;
      return parents.filter((c) => c.name.toLowerCase() === 'other' || c.type === 'savings');
    }
    return parents;
  }, [categories, type]);

  // Filter subcategories
  const filteredSubcategories = useMemo(() => {
    if (!categories || !selectedCategory) return [];
    return categories.filter((c) => c.parentCategoryId === selectedCategory.id);
  }, [categories, selectedCategory]);

  const handleDateChangeAndroid = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleDateChangeIOS = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setDatePickerValue(selectedDate);
    }
  };

  const saveIOSDate = () => {
    setDate(datePickerValue);
    setShowDatePicker(false);
  };

  const handleTypeChange = (newType: TxType) => {
    setType(newType);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const handleSave = async () => {
    if (!transaction) return;

    const parsedAmount = Number(amount.trim());
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ variant: 'warning', message: t('feedback.validationAmount') });
      return;
    }

    if (!merchant.trim()) {
      toast({ variant: 'warning', message: t('feedback.validationMerchant') });
      return;
    }

    if (!selectedCategory && type !== 'transfer') {
      toast({ variant: 'warning', message: t('feedback.validationCategory') });
      return;
    }

    setSaving(true);
    try {
      const dateString = date.toISOString().split('T')[0];

      await updateTxMutation.mutateAsync({
        id: transaction.id,
        amount: parsedAmount,
        currency,
        type,
        merchant: merchant.trim(),
        title: merchant.trim(),
        categoryId: selectedCategory?.id || undefined,
        subcategoryId: selectedSubcategory?.id || undefined,
        date: dateString,
        note: note.trim() || undefined,
      });

      toast({ variant: 'success', message: t('feedback.transactionUpdated') });
      router.back();
    } catch (err: unknown) {
      if (__DEV__) console.error('Update transaction failed:', err);
      toast({ variant: 'error', message: t('feedback.transactionUpdateFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;

    const confirmed = await confirm({
      title: t('feedback.deleteTransactionTitle'),
      message: t('feedback.deleteTransactionMessage'),
      variant: 'destructive',
      confirmLabel: t('common.delete'),
    });
    if (!confirmed) return;

    try {
      await deleteTxMutation.mutateAsync(transaction.id);
      toast({ variant: 'success', message: t('feedback.transactionDeleted') });
      router.back();
    } catch (err: unknown) {
      if (__DEV__) console.error('Delete transaction failed:', err);
      toast({ variant: 'error', message: t('feedback.transactionDeleteFailed') });
    }
  };

  if (isTxLoading) {
    return (
      <Screen>
        <ScreenLoadingState message={t('states.transactionLoading')} />
      </Screen>
    );
  }

  if (!transaction) {
    return (
      <Screen>
        <View style={[styles.loadingContainer, { paddingHorizontal: spacing.xl }]}>
          <Text variant="h3" align="center">{t('states.transactionNotFoundTitle')}</Text>
          <Text variant="bodySmall" color={colors.textMuted} align="center" style={{ marginTop: spacing.sm }}>
            {t('states.transactionNotFoundMessage')}
          </Text>
          <Button label={t('common.back')} onPress={() => router.back()} style={{ marginTop: spacing.xl }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSoft }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <Text variant="h2" style={{ flex: 1, textAlign: 'center' }}>
            Edit Transaction
          </Text>
          <Pressable
            onPress={handleDelete}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.delete')}
          >
            <Trash2 size={20} color={colors.danger} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.xl }]}
        >
          {/* Type Selector */}
          <View style={[styles.typeSelectorRow, { marginTop: spacing.lg }]}>
            {(['expense', 'income', 'transfer'] as TxType[]).map((tType) => {
              const selected = type === tType;
              const activeColor = 
                tType === 'income' ? colors.success :
                tType === 'transfer' ? colors.ai :
                colors.primary;
              return (
                <Pressable
                  key={tType}
                  onPress={() => handleTypeChange(tType)}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: selected ? colors.surfaceElevated : colors.surface,
                      borderColor: selected ? activeColor : colors.borderSoft,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Text
                    variant="bodySmall"
                    weight="bold"
                    color={selected ? activeColor : colors.textMuted}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {tType}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Amount Input */}
          <View style={{ marginTop: spacing.xl }}>
            <Input
              label={`Amount (${currency})`}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Merchant Input */}
          <View style={{ marginTop: spacing.md }}>
            <Input
              label="Merchant / Title"
              placeholder="e.g. Walmart, Salary, Rent"
              value={merchant}
              onChangeText={setMerchant}
            />
          </View>

          {/* Category Dropdown */}
          <View style={{ marginTop: spacing.md }}>
            <Text variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.xs }}>
              Category {type === 'transfer' ? '(Optional)' : ''}
            </Text>
            <Card
              variant="default"
              style={styles.dropdownCard}
              onPress={() => isCatsError ? refetchCats() : !isCatsLoading && setShowCategorySelector(true)}
            >
              <View style={styles.dropdownContent}>
                <Text variant="bodySmall" color={isCatsError ? colors.danger : (selectedCategory ? colors.textPrimary : colors.textMuted)}>
                  {isCatsError 
                    ? 'Failed to load. Tap to retry.' 
                    : isCatsLoading 
                      ? 'Loading categories...' 
                      : selectedCategory 
                        ? selectedCategory.name 
                        : 'Select a category'}
                </Text>
                {isCatsLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <ChevronDown size={16} color={isCatsError ? colors.danger : colors.textMuted} />
                )}
              </View>
            </Card>
          </View>

          {/* Subcategory Dropdown */}
          {selectedCategory && filteredSubcategories.length > 0 && (
            <View style={{ marginTop: spacing.md }}>
              <Text variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.xs }}>
                Subcategory (Optional)
              </Text>
              <Card
                variant="default"
                style={styles.dropdownCard}
                onPress={() => setShowSubcategorySelector(true)}
              >
                <View style={styles.dropdownContent}>
                  <Text variant="bodySmall" color={selectedSubcategory ? colors.textPrimary : colors.textMuted}>
                    {selectedSubcategory ? selectedSubcategory.name : t('transactions.selectSubcategory')}
                  </Text>
                  <ChevronDown size={16} color={colors.textMuted} />
                </View>
              </Card>
            </View>
          )}

          {/* Date Picker trigger */}
          <View style={{ marginTop: spacing.md }}>
            <Text variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.xs }}>
              Date
            </Text>
            <Card
              variant="default"
              style={styles.dropdownCard}
              onPress={() => {
                setDatePickerValue(date);
                setShowDatePicker(true);
              }}
            >
              <View style={styles.dropdownContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Calendar size={14} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
                  <Text variant="bodySmall" color={colors.textPrimary}>
                    {formatDate(date)}
                  </Text>
                </View>
                <ChevronDown size={16} color={colors.textMuted} />
              </View>
            </Card>
          </View>

          {/* Note Input */}
          <View style={{ marginTop: spacing.md }}>
            <Input
              label="Note (Optional)"
              placeholder="Add details..."
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Action Buttons */}
          <View style={{ marginTop: spacing.xxxxl, gap: spacing.md, marginBottom: spacing.xl }}>
            <Button
              label="Save Changes"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
            />
            <Button
              label="Delete Transaction"
              variant="danger"
              onPress={handleDelete}
              disabled={saving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Selector Modal */}
      <Modal visible={showCategorySelector} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.xl }]}>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>Select Category</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {isCatsLoading && <ActivityIndicator color={colors.primary} />}
              {filteredCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    setSelectedCategory({ id: cat.id, name: cat.name });
                    setSelectedSubcategory(null);
                    setShowCategorySelector(false);
                  }}
                  style={[styles.modalItem, { borderBottomColor: colors.borderSoft }]}
                >
                  <Text variant="bodySmall" color={colors.textPrimary}>{cat.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button
              label="Close"
              variant="ghost"
              onPress={() => setShowCategorySelector(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Subcategory Selector Modal */}
      <Modal visible={showSubcategorySelector} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.xl }]}>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>Select Subcategory</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <Pressable
                onPress={() => {
                  setSelectedSubcategory(null);
                  setShowSubcategorySelector(false);
                }}
                style={[styles.modalItem, { borderBottomColor: colors.borderSoft }]}
              >
                <Text variant="bodySmall" color={colors.textMuted}>None (Clear subcategory)</Text>
              </Pressable>
              {filteredSubcategories.map((sub) => (
                <Pressable
                  key={sub.id}
                  onPress={() => {
                    setSelectedSubcategory({ id: sub.id, name: sub.name });
                    setShowSubcategorySelector(false);
                  }}
                  style={[styles.modalItem, { borderBottomColor: colors.borderSoft }]}
                >
                  <Text variant="bodySmall" color={colors.textPrimary}>{sub.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button
              label="Close"
              variant="ghost"
              onPress={() => setShowSubcategorySelector(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* iOS Date Picker Modal */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.iosDatePickerContainer, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg }]}>
              <View style={[styles.iosDatePickerHeader, { borderBottomColor: colors.borderSoft }]}>
                <Pressable onPress={saveIOSDate}>
                  <Text variant="body" color={colors.primary} weight="bold">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={datePickerValue}
                mode="date"
                display="spinner"
                textColor={colors.textPrimary}
                onChange={handleDateChangeIOS}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date Picker */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChangeAndroid}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownCard: {
    padding: 12,
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    maxHeight: '80%',
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iosDatePickerContainer: {
    overflow: 'hidden',
    paddingBottom: 20,
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
