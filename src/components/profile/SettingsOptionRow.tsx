import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Text, Card } from '@/components/ui';

interface SettingsOptionRowProps {
  label: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function SettingsOptionRow({
  label,
  description,
  selected = false,
  onPress,
  disabled = false,
}: SettingsOptionRowProps) {
  const { colors, spacing } = useTheme();

  return (
    <Card
      variant={selected ? 'elevated' : 'default'}
      onPress={disabled ? undefined : onPress}
      style={{ marginBottom: spacing.sm, opacity: disabled ? 0.6 : 1 }}
    >
      <View style={styles.row}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text variant="bodySmall" weight="medium">
            {label}
          </Text>
          {description ? (
            <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xxs }}>
              {description}
            </Text>
          ) : null}
        </View>
        {selected ? <Check size={18} color={colors.primary} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
});
