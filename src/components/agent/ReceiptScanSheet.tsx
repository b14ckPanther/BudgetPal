/**
 * Receipt scan modal — capture, preview, and upload from the Agent screen.
 */

import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Camera, ImageIcon, X, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Text, Button, Card } from '@/components/ui';
import { t } from '@/lib/i18n';
import { ReceiptScanUiState, ReceiptPreviewAsset } from '@/hooks/useReceiptScan';

interface ReceiptScanSheetProps {
  visible: boolean;
  uiState: ReceiptScanUiState;
  preview: ReceiptPreviewAsset | null;
  errorMessage: string | null;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseLibrary: () => void;
  onRetake: () => void;
  onChooseAnother: () => void;
  onScan: () => void;
  onRetry: () => void;
}

export function ReceiptScanSheet({
  visible,
  uiState,
  preview,
  errorMessage,
  onClose,
  onTakePhoto,
  onChooseLibrary,
  onRetake,
  onChooseAnother,
  onScan,
  onRetry,
}: ReceiptScanSheetProps) {
  const { colors, spacing, radius } = useTheme();

  const showSelecting = uiState === 'selecting';
  const showPreview = uiState === 'preview' || uiState === 'scanning';
  const showFailed = uiState === 'scan_failed';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfaceElevated,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.lg,
              paddingBottom: spacing.xxl,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text variant="h3">{t('receipt.scanTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {showSelecting && (
            <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
              <Button
                label={t('receipt.takePhoto')}
                variant="primary"
                onPress={onTakePhoto}
                icon={<Camera size={18} color={colors.textInverse} />}
              />
              <Button
                label={t('receipt.chooseLibrary')}
                variant="secondary"
                onPress={onChooseLibrary}
                icon={<ImageIcon size={18} color={colors.primary} />}
              />
              <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
            </View>
          )}

          {showPreview && preview && (
            <View style={{ marginTop: spacing.lg }}>
              <Text variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
                {t('receipt.previewTitle')}
              </Text>
              <Card variant="default" style={{ overflow: 'hidden', padding: 0 }}>
                <Image source={{ uri: preview.uri }} style={styles.previewImage} resizeMode="contain" />
              </Card>

              {uiState === 'scanning' ? (
                <View style={[styles.scanningRow, { marginTop: spacing.lg }]}>
                  <ActivityIndicator color={colors.primary} />
                  <Text variant="bodySmall" color={colors.textSecondary} style={{ marginLeft: spacing.sm }}>
                    {t('receipt.scanning')}
                  </Text>
                </View>
              ) : (
                <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
                  <Button label={t('receipt.scanButton')} variant="primary" onPress={onScan} />
                  <View style={styles.rowActions}>
                    <Button label={t('receipt.retake')} variant="secondary" size="sm" onPress={onRetake} style={{ flex: 1 }} />
                    <Button label={t('receipt.chooseAnother')} variant="ghost" size="sm" onPress={onChooseAnother} style={{ flex: 1 }} />
                  </View>
                  <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
                </View>
              )}
            </View>
          )}

          {showFailed && (
            <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
              <Text variant="bodySmall" color={colors.danger}>
                {errorMessage || t('receipt.scanFailed')}
              </Text>
              <Button label={t('voice.tryAgain')} variant="primary" onPress={onRetry} icon={<RefreshCw size={16} color={colors.textInverse} />} />
              <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    maxHeight: '92%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#0B1020',
  },
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
});
