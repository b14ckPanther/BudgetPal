/**
 * BudgetPal — Report Detail Screen
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Screen, Text, Button, Card } from '@/components/ui';
import { ScreenLoadingState, ScreenErrorState } from '@/components/feedback';
import { ReportCard } from '@/components/cards/ReportCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MoneyAmount } from '@/components/ui/MoneyAmount';
import { useFeedback } from '@/components/feedback';
import { t } from '@/lib/i18n';
import { useLocale, useIsRtl } from '@/components/locale';
import { Report } from '@/types/api';
import { getReportByIdApi, downloadAndShareReport } from '@/services/reports';

function ReportDetailHeader({
  title,
  subtitle,
  onBack,
  onShare,
  shareDisabled,
  sharing,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onShare?: () => void;
  shareDisabled?: boolean;
  sharing?: boolean;
}) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const isRtl = useIsRtl();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + spacing.sm,
          paddingBottom: spacing.md,
          paddingHorizontal: spacing.lg,
          borderBottomColor: colors.borderSoft,
          backgroundColor: colors.background,
        },
      ]}
    >
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          { opacity: pressed ? 0.7 : 1, minHeight: 44, minWidth: 44 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('reports.backToReports')}
      >
        <ArrowLeft
          size={20}
          color={colors.primary}
          style={isRtl ? { transform: [{ scaleX: -1 }] } : undefined}
        />
        <Text variant="bodySmall" color={colors.primary} weight="medium" style={{ marginStart: 4 }}>
          {t('common.back')}
        </Text>
      </Pressable>

      <View style={styles.headerTitleWrap}>
        <Text variant="label" numberOfLines={1} style={{ textAlign: 'center' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color={colors.textMuted} numberOfLines={1} style={{ textAlign: 'center', marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onShare ? (
        <Pressable
          onPress={onShare}
          disabled={shareDisabled || sharing}
          style={({ pressed }) => [
            styles.shareButton,
            {
              backgroundColor: colors.primarySoft,
              opacity: shareDisabled || sharing ? 0.5 : pressed ? 0.8 : 1,
              minWidth: 44,
              minHeight: 44,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('reports.sharePdf')}
        >
          {sharing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Share2 size={18} color={colors.primary} />
          )}
        </Pressable>
      ) : (
        <View style={styles.sharePlaceholder} />
      )}
    </View>
  );
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const { toast } = useFeedback();
  const router = useRouter();
  const { locale } = useLocale();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/reports');
    }
  }, [router]);

  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoadError(false);
    setLoading(true);
    try {
      const found = await getReportByIdApi(id);
      setReport(found);
    } catch {
      setLoadError(true);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleShare = async () => {
    if (!report?.hasPdf) return;
    setSharing(true);
    try {
      await downloadAndShareReport(report.id, report.title);
    } catch {
      toast({ variant: 'error', message: t('reports.shareError') });
    } finally {
      setSharing(false);
    }
  };

  const periodLabel = report
    ? report.metrics.periodLabel || `${report.dateFrom} – ${report.dateTo}`
    : undefined;

  const headerTitle = loading
    ? t('reports.title')
    : report?.title || t('reports.notFound');

  return (
    <Screen edges={[]}>
      <ReportDetailHeader
        title={headerTitle}
        subtitle={!loading && report ? periodLabel : undefined}
        onBack={handleBack}
        onShare={report?.hasPdf ? handleShare : undefined}
        shareDisabled={!report?.hasPdf}
        sharing={sharing}
      />

      {loading ? (
        <ScreenLoadingState message={t('reports.loadingDetail')} />
      ) : loadError ? (
        <ScreenErrorState
          title={t('states.reportsLoadFailedTitle')}
          message={t('states.reportsLoadFailedMessage')}
          onRetry={() => void load()}
        />
      ) : !report ? (
        <View style={[styles.centered, { paddingHorizontal: spacing.xl }]}>
          <Text variant="h3" align="center">{t('reports.notFound')}</Text>
          <Text variant="bodySmall" color={colors.textMuted} align="center" style={{ marginTop: spacing.sm }}>
            {t('reports.notFoundHint')}
          </Text>
          <Button
            label={t('reports.backToReports')}
            onPress={handleBack}
            style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          <ReportCard
            title={report.title}
            period={periodLabel || ''}
            totalIncome={report.metrics.totalIncome}
            totalExpenses={report.metrics.totalExpenses}
            netSavings={report.metrics.netSavings}
            summary={report.summary}
          />

          {report.metrics.safeToSpend != null && (
            <Card variant="glass" style={{ marginTop: spacing.lg, padding: spacing.lg }}>
              <Text variant="caption" color={colors.textMuted}>{t('reports.safeToSpend')}</Text>
              <MoneyAmount amount={report.metrics.safeToSpend} size="md" color={colors.primary} />
            </Card>
          )}

          {report.metrics.categoryBreakdown?.length > 0 && (
            <View style={{ marginTop: spacing.xl }}>
              <Text variant="h3" style={{ marginBottom: spacing.md }}>{t('reports.categoryBreakdown')}</Text>
              {report.metrics.categoryBreakdown.slice(0, 8).map((cat) => (
                <View key={cat.categoryName} style={{ marginBottom: spacing.md }}>
                  <View style={styles.row}>
                    <Text variant="bodySmall" weight="medium" style={{ flex: 1, marginRight: spacing.sm }}>
                      {cat.categoryName}
                    </Text>
                    <MoneyAmount amount={cat.amount} size="sm" />
                  </View>
                  <ProgressBar progress={cat.percentage} height={6} />
                </View>
              ))}
            </View>
          )}

          {report.metrics.recommendations && report.metrics.recommendations.length > 0 && (
            <Card variant="glass" style={{ marginTop: spacing.lg, padding: spacing.lg }}>
              <Text variant="label" color={colors.ai} style={{ marginBottom: spacing.sm }}>
                {t('reports.recommendations')}
              </Text>
              {report.metrics.recommendations.map((rec, i) => (
                <Text key={i} variant="bodySmall" style={{ marginBottom: spacing.xs }}>{rec}</Text>
              ))}
            </Card>
          )}

          {report.hasPdf && (
            <Button
              label={t('reports.exportPdf')}
              onPress={handleShare}
              disabled={sharing}
              style={{ marginTop: spacing.xxl }}
            />
          )}
          {!report.hasPdf && locale === 'he' && (
            <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.lg }}>
              {t('reports.hebrewPdfUnavailable')}
            </Text>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 72,
    paddingVertical: 6,
  },
  headerTitleWrap: {
    flex: 1,
    paddingHorizontal: 8,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharePlaceholder: {
    width: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
});
