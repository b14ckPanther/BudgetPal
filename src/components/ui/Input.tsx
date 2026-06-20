/**
 * BudgetPal — Input Component
 * Themed text input with label, placeholder, and error states.
 */

import React, { useState } from 'react';
import { View, TextInput, StyleSheet, type ViewStyle, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  ...rest
}: InputProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.textMuted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          {
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.md,
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            borderColor: error
              ? colors.danger
              : isFocused
                ? colors.primary
                : colors.borderSoft,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          },
        ]}
        {...rest}
      />
      {error && (
        <Text variant="caption" color={colors.danger} style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
  },
  error: {
    marginTop: 4,
  },
});
