/**
 * BudgetPal — Onboarding Screen
 * Multi-step onboarding: currency, income, budget style, financial goal.
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Screen, Text, Input, Button, Card } from '@/components/ui';
import { t } from '@/lib/i18n';
import { updateProfile } from '@/services/profile';
import { createInitialBudget } from '@/services/budgets';

type BudgetStyleOption = 'strict' | 'balanced' | 'chill';

export default function OnboardingScreen() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState('ILS');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [budgetStyle, setBudgetStyle] = useState<BudgetStyleOption>('balanced');
  const [mainFinancialGoal, setMainFinancialGoal] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = [
    t('onboarding.stepCurrency'),
    t('onboarding.stepIncome'),
    t('onboarding.stepBudgetStyle'),
    t('onboarding.stepGoal'),
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const incomeNum = Number(monthlyIncome) || 0;
        await updateProfile({
          currency,
          monthlyIncome: incomeNum,
          budgetStyle,
          mainFinancialGoal,
          onboardingCompleted: true,
        });

        await createInitialBudget({
          name: 'Main Budget',
          currency,
          monthlyIncome: incomeNum,
          budgetStyle,
          cycleStartDay: 1,
        });

        router.replace('/(tabs)/agent');
      } catch (err: any) {
        Alert.alert('Onboarding Error', err.message || 'Failed to complete onboarding configuration.');
      } finally {
        setLoading(false);
      }
    }
  };

  const budgetStyles: { key: BudgetStyleOption; label: string; desc: string }[] = [
    { key: 'strict', label: t('onboarding.strict'), desc: t('onboarding.strictDesc') },
    { key: 'balanced', label: t('onboarding.balanced'), desc: t('onboarding.balancedDesc') },
    { key: 'chill', label: t('onboarding.chill'), desc: t('onboarding.chillDesc') },
  ];

  const currencies = ['ILS', 'USD', 'EUR', 'GBP'];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="h2" color={colors.primary}>
            {t('onboarding.title')}
          </Text>
          <View style={[styles.progressContainer, { marginTop: spacing.xl }]}>
            {steps.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: idx <= step ? colors.primary : colors.borderSoft,
                    width: idx === step ? 24 : 8,
                    borderRadius: radius.full,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <Text variant="h3" style={{ marginTop: spacing.xxxl }}>
          {steps[step]}
        </Text>

        <View style={[styles.stepContent, { marginTop: spacing.xxl }]}>
          {step === 0 && (
            <View style={styles.optionsGrid}>
              {currencies.map((cur) => (
                <Pressable
                  key={cur}
                  onPress={() => setCurrency(cur)}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: currency === cur ? colors.primarySoft : colors.surface,
                      borderColor: currency === cur ? colors.primary : colors.borderSoft,
                      borderRadius: radius.lg,
                      padding: spacing.lg,
                    },
                  ]}
                >
                  <Text variant="h3" color={currency === cur ? colors.primary : colors.textPrimary}>
                    {cur}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {step === 1 && (
            <Input
              label={t('budget.monthlyIncome')}
              placeholder="7500"
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              keyboardType="numeric"
            />
          )}

          {step === 2 && (
            <View style={{ gap: spacing.md }}>
              {budgetStyles.map((bs) => (
                <Pressable
                  key={bs.key}
                  onPress={() => setBudgetStyle(bs.key)}
                >
                  <Card
                    variant={budgetStyle === bs.key ? 'elevated' : 'default'}
                    accentColor={budgetStyle === bs.key ? colors.primary : undefined}
                  >
                    <Text variant="h3" color={budgetStyle === bs.key ? colors.primary : colors.textPrimary}>
                      {bs.label}
                    </Text>
                    <Text variant="bodySmall" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
                      {bs.desc}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}

          {step === 3 && (
            <Input
              label={t('onboarding.stepGoal')}
              placeholder="Save more, reduce spending, track better..."
              multiline
              numberOfLines={3}
              value={mainFinancialGoal}
              onChangeText={setMainFinancialGoal}
            />
          )}
        </View>

        <View style={[styles.actions, { marginTop: spacing.xxxxl }]}>
          {step > 0 && (
            <Button
              label={t('common.back')}
              variant="ghost"
              onPress={() => setStep(step - 1)}
              disabled={loading}
            />
          )}
          <Button
            label={step === steps.length - 1 ? t('onboarding.getStarted') : t('common.next')}
            onPress={handleNext}
            loading={loading}
            disabled={loading}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  progressDot: {
    height: 8,
  },
  stepContent: {
    flex: 1,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    borderWidth: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
