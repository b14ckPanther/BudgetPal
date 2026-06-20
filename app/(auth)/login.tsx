/**
 * BudgetPal — Login Screen
 * Premium dark fintech login with email/username and password.
 */

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Screen, Text, Input, Button } from '@/components/ui';
import { t } from '@/lib/i18n';
import { signInWithIdentifier } from '@/services/auth';

export default function LoginScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email/username and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await signInWithIdentifier(identifier.trim(), password);

      if (data?.user) {
        router.replace('/(tabs)/agent');
      } else {
        Alert.alert('Login Error', t('auth.invalidCredentials'));
      }
    } catch (err: any) {
      console.log('Login error details:', err);
      const errMsg = err?.message || '';
      if (
        errMsg.toLowerCase().includes('network') || 
        errMsg.toLowerCase().includes('failed to fetch') ||
        errMsg.toLowerCase().includes('typeerror')
      ) {
        Alert.alert('Connection Error', 'Unable to connect to the login server. Please make sure the server is running and your device has access.');
      } else {
        Alert.alert('Login Error', errMsg || t('auth.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text variant="h1" color={colors.primary}>
            {t('common.appName')}
          </Text>
          <Text variant="body" color={colors.textMuted} style={{ marginTop: spacing.sm }}>
            {t('auth.loginSubtitle')}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('auth.emailOrUsername')}
            placeholder="Noor@budgetPal.com"
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType="default"
            autoCapitalize="none"
          />
          <Input
            label={t('auth.password')}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text variant="caption" color={colors.textMuted} style={styles.note}>
            Password reset uses the account email.
          </Text>

          <Button
            label={t('auth.login')}
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={{ marginTop: spacing.lg }}
          />

          <View style={[styles.footer, { marginTop: spacing.xxl }]}>
            <Text variant="bodySmall" color={colors.textMuted}>
              {t('auth.noAccount')}{' '}
            </Text>
            <Text
              variant="bodySmall"
              weight="medium"
              color={colors.primary}
              onPress={() => router.push('/(auth)/signup')}
            >
              {t('auth.signup')}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  note: {
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

