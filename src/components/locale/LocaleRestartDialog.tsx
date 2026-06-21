/**
 * Branded restart prompt when RTL direction changes require reload.
 */

import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { useLocale } from './LocaleProvider';
import { useTheme } from '@/theme';
import { Text, Button, Card } from '@/components/ui';
import { t } from '@/lib/i18n';

export function LocaleRestartDialog() {
  const { needsRestart, applyRestart, dismissRestartPrompt } = useLocale();
  const { colors, spacing, radius } = useTheme();

  if (!needsRestart) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismissRestartPrompt}>
      <View style={[styles.overlay, { backgroundColor: colors.black40 }]}>
        <Card variant="elevated" style={{ borderRadius: radius.lg, padding: spacing.xl, width: '100%' }}>
          <Text variant="h3">{t('profileSettings.localeRestartTitle')}</Text>
          <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.sm }}>
            {t('profileSettings.localeRestartMessage')}
          </Text>
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <Button label={t('profileSettings.localeRestartAction')} onPress={() => void applyRestart()} />
            <Button
              label={t('profileSettings.localeRestartLater')}
              variant="ghost"
              onPress={dismissRestartPrompt}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
});
