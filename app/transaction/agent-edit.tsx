/**
 * BudgetPal — Edit Voice Transaction (agent action confirm with overrides)
 */

import React, { useMemo, useState } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, ChevronDown, ArrowLeft } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/theme';
import { Screen, Text, Input, Button, Card } from '@/components/ui';
import { t } from '@/lib/i18n';
import { formatDate } from '@/lib/dates';
import { useCategories, useCurrentBudget } from '@/hooks/useBudgetQueries';
import { confirmAgentAction } from '@/services/agent';
import { useFeedback } from '@/components/feedback';

type TxType = 'expense' | 'income' | 'transfer';

export default function AgentEditTransactionScreen() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useFeedback();
  const params = useLocalSearchParams<{
    actionId?: string;
    receiptId?: string;
    source?: string;
    amount?: string;
    merchant?: string;
    title?: string;
    categoryId?: string;
    categoryName?: string;
    subcategoryId?: string;
    subcategoryName?: string;
    date?: string;
    type?: string;
    note?: string;
  }>();

  const actionId = params.actionId;
  const isReceiptEdit = params.source === 'receipt';
  const { data: categories, isLoading: isCatsLoading, isError: isCatsError, refetch: refetchCats } = useCategories();
  const { data: budget } = useCurrentBudget();

  const [type, setType] = useState<TxType>((params.type as TxType) || 'expense');
  const [amount, setAmount] = useState(params.amount || '');
  const [merchant, setMerchant] = useState(params.merchant || params.title || '');
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(
    params.categoryId ? { id: params.categoryId, name: params.categoryName || '' } : null
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<{ id: string; name: string } | null>(
    params.subcategoryId ? { id: params.subcategoryId, name: params.subcategoryName || '' } : null
  );
  const [date, setDate] = useState<Date>(params.date ? new Date(params.date) : new Date());
  const [note, setNote] = useState(params.note || '');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showSubcategorySelector, setShowSubcategorySelector] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState<Date>(new Date());

  const currency = budget?.currency || 'ILS';

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    const parents = categories.filter((c) => !c.parentCategoryId);
    if (type === 'expense') return parents.filter((c) => c.type === 'expense');
    if (type === 'income') return parents.filter((c) => c.type === 'income');
    return parents.filter((c) => c.type === 'transfer' || c.type === 'savings');
  }, [categories, type]);

  const filteredSubcategories = useMemo(() => {
    if (!categories || !selectedCategory) return [];
    return categories.filter((c) => c.parentCategoryId === selectedCategory.id);
  }, [categories, selectedCategory]);

  const handleSave = async () => {
    if (!actionId) {
      toast({ variant: 'error', message: t('voice.missingAction') });
      return;
    }

    const parsedAmount = Number(amount.trim());
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ variant: 'warning', message: t('voice.invalidAmount') });
      return;
    }

    if (!merchant.trim()) {
      toast({ variant: 'warning', message: t('voice.invalidMerchant') });
      return;
    }

    if (!selectedCategory && type !== 'transfer') {
      toast({ variant: 'warning', message: t('voice.invalidCategory') });
      return;
    }

    setLoading(true);
    try {
      const dateString = date.toISOString().split('T')[0];
      const label = merchant.trim();

      await confirmAgentAction(actionId, {
        type,
        amount: parsedAmount,
        currency,
        merchant: label,
        title: params.title?.trim() || label,
        categoryId: selectedCategory?.id,
        categoryName: selectedCategory?.name || 'Other',
        subcategoryId: selectedSubcategory?.id || null,
        subcategoryName: selectedSubcategory?.name || null,
        date: dateString,
        note: note.trim() || null,
      });

      queryClient.invalidateQueries();
      toast({
        variant: 'success',
        message: isReceiptEdit ? t('feedback.receiptTransactionSaved') : t('feedback.voiceTransactionSaved'),
      });
      router.back();
    } catch (err: unknown) {
      if (__DEV__) console.error('Agent edit confirm failed:', err);
      toast({ variant: 'error', message: t('feedback.editSaveFailed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: colors.borderSoft }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <Text variant="h2" style={{ flex: 1, textAlign: 'center', marginRight: 40 }}>
            {isReceiptEdit ? t('receipt.editTitle') : t('voice.editTitle')}
          </Text>
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.xl }]}>
          <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.md }}>
            {isReceiptEdit ? t('receipt.editSubtitle') : t('voice.editSubtitle')}
          </Text>

          <View style={[styles.typeSelectorRow, { marginTop: spacing.lg }]}>
            {(['expense', 'income'] as TxType[]).map((tType) => {
              const selected = type === tType;
              const activeColor = tType === 'income' ? colors.success : colors.primary;
              return (
                <Pressable
                  key={tType}
                  onPress={() => {
                    setType(tType);
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                  }}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: selected ? colors.surfaceElevated : colors.surface,
                      borderColor: selected ? activeColor : colors.borderSoft,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Text variant="bodySmall" weight="bold" color={selected ? activeColor : colors.textMuted} style={{ textTransform: 'capitalize' }}>
                    {tType}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <Input label={`${t('cards.amount')} (${currency})`} placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="numeric" />
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Input label={t('cards.merchant')} placeholder="e.g. Fuel station" value={merchant} onChangeText={setMerchant} />
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Text variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.xs }}>{t('cards.category')}</Text>
            <Card variant="default" style={styles.dropdownCard} onPress={() => isCatsError ? refetchCats() : !isCatsLoading && setShowCategorySelector(true)}>
              <View style={styles.dropdownContent}>
                <Text variant="bodySmall" color={selectedCategory ? colors.textPrimary : colors.textMuted}>
                  {isCatsLoading ? t('common.loading') : selectedCategory?.name || t('voice.selectCategory')}
                </Text>
                {isCatsLoading ? <ActivityIndicator size="small" color={colors.primary} /> : <ChevronDown size={16} color={colors.textMuted} />}
              </View>
            </Card>
          </View>

          {selectedCategory && filteredSubcategories.length > 0 && (
            <View style={{ marginTop: spacing.md }}>
              <Text variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.xs }}>{t('cards.subcategory')}</Text>
              <Card variant="default" style={styles.dropdownCard} onPress={() => setShowSubcategorySelector(true)}>
                <View style={styles.dropdownContent}>
                  <Text variant="bodySmall" color={selectedSubcategory ? colors.textPrimary : colors.textMuted}>
                    {selectedSubcategory?.name || t('voice.selectSubcategory')}
                  </Text>
                  <ChevronDown size={16} color={colors.textMuted} />
                </View>
              </Card>
            </View>
          )}

          <View style={{ marginTop: spacing.md }}>
            <Text variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.xs }}>{t('cards.date')}</Text>
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
                  <Text variant="bodySmall" color={colors.textPrimary}>{formatDate(date)}</Text>
                </View>
                <ChevronDown size={16} color={colors.textMuted} />
              </View>
            </Card>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Input label={t('voice.noteOptional')} placeholder="" value={note} onChangeText={setNote} multiline numberOfLines={3} />
          </View>

          <Button
            label={isReceiptEdit ? t('receipt.saveReceiptTransaction') : t('voice.saveVoiceTransaction')}
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={{ marginTop: spacing.xxxxl, marginBottom: spacing.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCategorySelector} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.xl }]}>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>{t('cards.category')}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
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
            <Button label={t('common.close')} variant="ghost" onPress={() => setShowCategorySelector(false)} style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>

      <Modal visible={showSubcategorySelector} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.xl }]}>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>{t('cards.subcategory')}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
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
            <Button label={t('common.close')} variant="ghost" onPress={() => setShowSubcategorySelector(false)} style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>

      {showDatePicker && Platform.OS === 'ios' && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.iosDatePickerContainer, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg }]}>
              <View style={[styles.iosDatePickerHeader, { borderBottomColor: colors.borderSoft }]}>
                <Pressable onPress={() => { setDate(datePickerValue); setShowDatePicker(false); }}>
                  <Text variant="body" color={colors.primary} weight="bold">{t('common.done')}</Text>
                </Pressable>
              </View>
              <DateTimePicker value={datePickerValue} mode="date" display="spinner" textColor={colors.textPrimary} onChange={(_e, d) => d && setDatePickerValue(d)} />
            </View>
          </View>
        </Modal>
      )}

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', height: 56, borderBottomWidth: 1, paddingHorizontal: 8 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  typeSelectorRow: { flexDirection: 'row', gap: 12 },
  typeButton: { flex: 1, height: 40, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  dropdownCard: { padding: 12 },
  dropdownContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { maxHeight: '80%' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1 },
  iosDatePickerContainer: { overflow: 'hidden', paddingBottom: 20 },
  iosDatePickerHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderBottomWidth: 1 },
});
