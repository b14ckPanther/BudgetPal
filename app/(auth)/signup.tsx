/**
 * BudgetPal — Signup Screen
 * Account creation with all required fields from the brief.
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Screen, Text, Input, Button } from '@/components/ui';
import { t } from '@/lib/i18n';
import { formatDate } from '@/lib/dates';
import { signUpWithEmail } from '@/services/auth';
import { getApiBaseUrl } from '@/lib/apiFetch';
import { useFeedback } from '@/components/feedback';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SignupScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { toast } = useFeedback();
  
  // Fields state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Age constants
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());

  // Date selection states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datePickerValue, setDatePickerValue] = useState<Date>(maxDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isAtLeast16 = (birthDate: Date): boolean => {
    const todayDate = new Date();
    let age = todayDate.getFullYear() - birthDate.getFullYear();
    const m = todayDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && todayDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 16;
  };

  const handleOpenDatePicker = () => {
    if (!selectedDate) {
      setSelectedDate(datePickerValue);
    }
    setShowDatePicker(true);
  };

  const handleDateChangeAndroid = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && date) {
      if (!isAtLeast16(date)) {
        toast({ variant: 'warning', message: t('auth.dobUnderage') });
        return;
      }
      setSelectedDate(date);
      setDatePickerValue(date);
    }
  };

  const handleDateChangeIOS = (event: any, date?: Date) => {
    if (date) {
      setDatePickerValue(date);
      setSelectedDate(date);
    }
  };

  const handleSignup = async () => {
    // 1. Standard Fields Validation
    if (
      !email.trim() ||
      !password.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim()
    ) {
      toast({ variant: 'warning', message: t('feedback.signupFieldsRequired') });
      return;
    }

    if (password !== confirmPassword) {
      toast({ variant: 'warning', message: t('feedback.signupPasswordMismatch') });
      return;
    }

    // 2. Username Format Validation
    const normalizedUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-z][a-z0-9_]{2,23}$/;
    if (!usernameRegex.test(normalizedUsername)) {
      toast({ variant: 'warning', message: t('auth.usernameInvalid') });
      return;
    }

    // 3. DOB Validation
    if (!selectedDate) {
      toast({ variant: 'warning', message: t('auth.dobRequired') });
      return;
    }
    if (!isAtLeast16(selectedDate)) {
      toast({ variant: 'warning', message: t('auth.dobUnderage') });
      return;
    }

    const formattedDOB = selectedDate.toISOString().split('T')[0];

    setLoading(true);

    // 4. Validate username availability first
    try {
      const checkResponse = await fetch(`${getApiBaseUrl()}/api/auth/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedUsername }),
      });
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.error) {
          // Ignore server database error, proceed to signup (trigger will handle it if it's indeed taken)
        } else if (!checkData.available) {
          toast({ variant: 'warning', message: t('feedback.usernameTaken') });
          setLoading(false);
          return;
        }
      }
    } catch {
      // Ignore network/network-offline errors on helper check, let signup endpoint handle it
    }

    try {
      // Create user via auth service
      const data = await signUpWithEmail(email.trim(), password.trim(), {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: `${firstName.trim()} ${lastName.trim()}`,
        date_of_birth: formattedDOB,
        username: normalizedUsername,
      });

      if (data?.user) {
        router.replace('/(auth)/onboarding');
      } else {
        toast({ variant: 'error', message: t('feedback.signupFailed') });
      }
    } catch (err: unknown) {
      if (__DEV__) console.error('Signup error:', err);

      let errMsg = t('feedback.signupFailed');
      const errStr = err instanceof Error ? err.message : '';

      if (
        errStr.toLowerCase().includes('duplicate') ||
        errStr.toLowerCase().includes('unique') ||
        errStr.toLowerCase().includes('already taken')
      ) {
        if (errStr.toLowerCase().includes('username') || errStr.toLowerCase().includes('lower(username)')) {
          errMsg = t('feedback.usernameTaken');
        } else {
          errMsg = t('feedback.emailTaken');
        }
      } else if (errStr.toLowerCase().includes('underage') || errStr.toLowerCase().includes('16 years')) {
        errMsg = t('auth.dobUnderage');
      } else if (
        errStr.toLowerCase().includes('username must be') ||
        errStr.toLowerCase().includes('username rule') ||
        errStr.toLowerCase().includes('username format')
      ) {
        errMsg = t('auth.usernameInvalid');
      }

      toast({ variant: 'error', message: errMsg });
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text variant="h1" color={colors.primary}>
              {t('common.appName')}
            </Text>
            <Text variant="body" color={colors.textMuted} style={{ marginTop: spacing.sm }}>
              {t('auth.signupSubtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <Input
                label={t('auth.firstName')}
                placeholder="Noor"
                value={firstName}
                onChangeText={setFirstName}
                containerStyle={styles.halfInput}
              />
              <Input
                label={t('auth.lastName')}
                placeholder="Mousa"
                value={lastName}
                onChangeText={setLastName}
                containerStyle={styles.halfInput}
              />
            </View>

            {/* Username Input */}
            <Input
              label={t('auth.username')}
              placeholder="noor_2026"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <Text variant="caption" color={colors.textMuted} style={styles.guideline}>
              {t('auth.usernameRule')}
            </Text>

            <Input
              label={t('auth.email')}
              placeholder="Noor@budgetPal.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Date of Birth Selection */}
            <Pressable onPress={handleOpenDatePicker}>
              <View pointerEvents="none">
                <Input
                  label={t('auth.dateOfBirth')}
                  placeholder={t('auth.selectDOB')}
                  value={selectedDate ? formatDate(selectedDate, true) : ''}
                  editable={false}
                />
              </View>
            </Pressable>

            <Input
              label={t('auth.password')}
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Input
              label={t('auth.confirmPassword')}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Button
              label={t('auth.signup')}
              onPress={handleSignup}
              loading={loading}
              disabled={loading}
              style={{ marginTop: spacing.lg }}
            />

            <View style={[styles.footer, { marginTop: spacing.xxl }]}>
              <Text variant="bodySmall" color={colors.textMuted}>
                {t('auth.hasAccount')}{' '}
              </Text>
              <Text
                variant="bodySmall"
                weight="medium"
                color={colors.primary}
                onPress={() => router.back()}
              >
                {t('auth.login')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modern iOS Modal Picker */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent visible={showDatePicker} animationType="slide">
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalDismiss} onPress={() => setShowDatePicker(false)} />
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.surfaceElevated, borderTopColor: colors.borderSoft },
              ]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: colors.borderSoft }]}>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text variant="body" color={colors.primary} weight="medium">
                    {t('common.done')}
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={datePickerValue}
                mode="date"
                display="spinner"
                maximumDate={maxDate}
                textColor={colors.textPrimary}
                onChange={handleDateChangeIOS}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Picker */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={datePickerValue}
          mode="date"
          display="default"
          maximumDate={maxDate}
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  guideline: {
    marginTop: -10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
  },
});
