/**
 * BudgetPal — Reports Screen
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { FileText, Calendar, Share2, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Screen, Text, Card, Button, Chip } from '@/components/ui';
import { ScreenLoadingState, ScreenErrorState } from '@/components/feedback';
import { ReportCard } from '@/components/cards/ReportCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFeedback } from '@/components/feedback';
import { t } from '@/lib/i18n';
import { formatLocalDate } from '@/lib/budgets';
import { createIdempotencyKey } from '@/lib/uuid';
import { Report, ReportType } from '@/types/api';
import { generateReportApi, listReportsApi, downloadAndShareReport } from '@/services/reports';
import { getCategories } from '@/services/categories';

type QuickType = ReportType | null;

export default function ReportsScreen() {
  const { colors, spacing } = useTheme();
  const { toast } = useFeedback();
  const router = useRouter();

  const [history, setHistory] = useState<Report[]>([]);
  const [preview, setPreview] = useState<Report | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedType, setSelectedType] = useState<QuickType>('monthly');
  const [dateFrom, setDateFrom] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const inFlightKeyRef = useRef<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const rows = await listReportsApi();
      setHistory(rows);
    } catch {
      toast({ variant: 'error', message: t('reports.loadError') });
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadHistory();
    getCategories()
      .then((cats) => {
        setCategories(
          cats.filter((c) => c.type === 'expense' && !c.parentCategoryId).map((c) => ({ id: c.id, name: c.name }))
        );
      })
      .catch(() => undefined);
  }, [loadHistory]);

  const needsCustomDates =
    selectedType === 'custom' || selectedType === 'category' || selectedType === 'merchant';

  const handleGenerate = async () => {
    if (!selectedType || generating) return;

    const idempotencyKey = inFlightKeyRef.current || createIdempotencyKey();
    inFlightKeyRef.current = idempotencyKey;
    setGenerating(true);

    try {
      const result = await generateReportApi({
        type: selectedType,
        dateFrom: needsCustomDates ? formatLocalDate(dateFrom) : undefined,
        dateTo: needsCustomDates ? formatLocalDate(dateTo) : undefined,
        categoryId: selectedType === 'category' ? categoryId || undefined : undefined,
        comparePrevious: selectedType === 'trend',
        includePdf: true,
        idempotencyKey,
      });

      if (!result.ok) {
        if ('noData' in result && result.noData) {
          setPreview(null);
          toast({ variant: 'info', message: result.message });
        } else if ('error' in result) {
          toast({ variant: 'error', message: result.error });
        }
        return;
      }

      setPreview(result.report);
      await loadHistory();
      toast({
        variant: 'success',
        message: result.reused ? t('reports.alreadyGenerated') : t('reports.generateSuccess'),
      });
    } catch {
      toast({ variant: 'error', message: t('reports.generateError') });
    } finally {
      setGenerating(false);
      inFlightKeyRef.current = null;
    }
  };

  const handleShare = async (report: Report) => {
    try {
      await downloadAndShareReport(report.id, report.title);
    } catch {
      toast({ variant: 'error', message: t('reports.shareError') });
    }
  };

  const quickActions: { key: QuickType; label: string }[] = [
    { key: 'weekly', label: t('reports.weeklyReport') },
    { key: 'monthly', label: t('reports.monthlyReport') },
    { key: 'custom', label: t('reports.customReport') },
    { key: 'category', label: t('reports.categoryReport') },
    { key: 'merchant', label: t('reports.merchantReport') },
    { key: 'trend', label: t('reports.trendReport') },
  ];

  return (
    <Screen backgroundVariant="hero">
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} tintColor={colors.primary} />
        }
      >
        <View style={{ marginTop: spacing.lg }}>
          <Text variant="h1" style={{ fontSize: 26, lineHeight: 32 }}>
            {t('reports.title')}
          </Text>
          <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.xxs }}>
            {t('reports.subtitle')}
          </Text>
        </View>

        <Text variant="label" color={colors.textMuted} style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          {t('reports.quickActions')}
        </Text>
        <View style={styles.chipRow}>
          {quickActions.map((action) => (
            <Chip
              key={action.key}
              label={action.label}
              selected={selectedType === action.key}
              onPress={() => setSelectedType(action.key)}
            />
          ))}
        </View>

        {needsCustomDates && (
          <Card variant="glass" style={{ marginTop: spacing.lg, padding: spacing.lg }}>
            <Text variant="label" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
              {t('reports.dateRange')}
            </Text>
            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
                <Calendar size={16} color={colors.primary} />
                <Text variant="bodySmall" style={{ marginLeft: spacing.xs }}>
                  {formatLocalDate(dateFrom)}
                </Text>
              </TouchableOpacity>
              <Text variant="bodySmall" color={colors.textMuted}>–</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
                <Calendar size={16} color={colors.primary} />
                <Text variant="bodySmall" style={{ marginLeft: spacing.xs }}>
                  {formatLocalDate(dateTo)}
                </Text>
              </TouchableOpacity>
            </View>
            {showFromPicker && (
              <DateTimePicker
                value={dateFrom}
                mode="date"
                display="default"
                maximumDate={dateTo}
                onChange={(_, d) => {
                  setShowFromPicker(false);
                  if (d) setDateFrom(d);
                }}
              />
            )}
            {showToPicker && (
              <DateTimePicker
                value={dateTo}
                mode="date"
                display="default"
                maximumDate={new Date()}
                minimumDate={dateFrom}
                onChange={(_, d) => {
                  setShowToPicker(false);
                  if (d) setDateTo(d);
                }}
              />
            )}
          </Card>
        )}

        {selectedType === 'category' && categories.length > 0 && (
          <View style={[styles.chipRow, { marginTop: spacing.md }]}>
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                selected={categoryId === cat.id}
                onPress={() => setCategoryId(cat.id)}
              />
            ))}
          </View>
        )}

        <Button
          label={generating ? t('reports.generating') : t('reports.generateReport')}
          onPress={handleGenerate}
          disabled={generating || (selectedType === 'category' && !categoryId)}
          style={{ marginTop: spacing.xl }}
        />

        {generating && (
          <View style={[styles.loadingRow, { marginTop: spacing.md }]}>
            <ActivityIndicator color={colors.primary} />
            <Text variant="bodySmall" color={colors.textMuted} style={{ marginLeft: spacing.sm }}>
              {t('reports.generatingDetail')}
            </Text>
          </View>
        )}

        {preview && (
          <View style={{ marginTop: spacing.xl }}>
            <ReportCard
              title={preview.title}
              period={preview.metrics.periodLabel || `${preview.dateFrom} – ${preview.dateTo}`}
              totalIncome={preview.metrics.totalIncome}
              totalExpenses={preview.metrics.totalExpenses}
              netSavings={preview.metrics.netSavings}
              summary={preview.summary}
              onPress={() => router.push({ pathname: '/reports/[id]', params: { id: preview.id } })}
            />
            {preview.metrics.categoryBreakdown?.slice(0, 5).map((cat) => (
              <View key={cat.categoryName} style={{ marginTop: spacing.md }}>
                <View style={styles.catRow}>
                  <Text variant="bodySmall" weight="medium">{cat.categoryName}</Text>
                  <Text variant="caption" color={colors.textMuted}>{cat.percentage}%</Text>
                </View>
                <ProgressBar progress={cat.percentage} height={6} />
              </View>
            ))}
            {preview.hasPdf && (
              <Button
                label={t('reports.exportPdf')}
                variant="secondary"
                onPress={() => handleShare(preview)}
                style={{ marginTop: spacing.lg }}
              />
            )}
          </View>
        )}

        <Text variant="label" color={colors.textMuted} style={{ marginTop: spacing.xxl, marginBottom: spacing.sm }}>
          {t('reports.history')}
        </Text>

        {loadingHistory ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : history.length === 0 ? (
          <Card variant="glass" style={styles.emptyCard}>
            <FileText size={40} color={colors.textMuted} />
            <Text variant="bodySmall" color={colors.textMuted} align="center" style={{ marginTop: spacing.md }}>
              {t('reports.historyEmpty')}
            </Text>
          </Card>
        ) : (
          history.map((item) => (
            <Card
              key={item.id}
              variant="elevated"
              style={{ marginBottom: spacing.md, padding: spacing.lg }}
              onPress={() => router.push({ pathname: '/reports/[id]', params: { id: item.id } })}
            >
              <View style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="label">{item.title}</Text>
                  <Text variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                    {item.metrics.periodLabel || `${item.dateFrom} – ${item.dateTo}`}
                  </Text>
                  <Text variant="caption" color={colors.textMuted}>
                    {t('reports.created')} {new Date(item.createdAt).toLocaleDateString('en-US')}
                  </Text>
                </View>
                {item.hasPdf && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleShare(item);
                    }}
                    style={[styles.shareBtn, { backgroundColor: colors.primarySoft }]}
                    accessibilityLabel={t('reports.sharePdf')}
                  >
                    <Share2 size={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </Card>
          ))
        )}

        <View style={{ height: spacing.xxxxl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  emptyCard: { padding: 32, alignItems: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareBtn: { padding: 8, borderRadius: 8 },
});
