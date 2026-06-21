/**
 * Local on-device budget alert notifications (no remote push).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';
import { BudgetStyle } from '@/types/api';
import { BudgetSummary } from '@/lib/budgets';
import { highestCrossedThreshold } from '@/lib/budgetStylePolicy';
import { t } from '@/lib/i18n';

const ALERT_STATE_KEY = 'budgetpal.budget_alert_state';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type AlertStateMap = Record<string, number>;

async function loadAlertState(userId: string): Promise<AlertStateMap> {
  const raw = await AsyncStorage.getItem(`${ALERT_STATE_KEY}.${userId}`);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AlertStateMap;
  } catch {
    return {};
  }
}

async function saveAlertState(userId: string, state: AlertStateMap): Promise<void> {
  await AsyncStorage.setItem(`${ALERT_STATE_KEY}.${userId}`, JSON.stringify(state));
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return 'granted';
  if (settings.status === 'denied') return 'denied';
  return 'undetermined';
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const result = await Notifications.requestPermissionsAsync();
  return result.granted === true;
}

export async function openDeviceSettings(): Promise<void> {
  await Linking.openSettings();
}

export async function evaluateBudgetAlertsAfterTransaction(params: {
  userId: string;
  summary: BudgetSummary;
  budgetStyle: BudgetStyle;
  notificationsEnabled: boolean;
}): Promise<void> {
  if (!params.notificationsEnabled) return;

  const permission = await getNotificationPermissionStatus();
  if (permission !== 'granted') return;

  const state = await loadAlertState(params.userId);
  let changed = false;

  for (const cat of params.summary.categories) {
    if (cat.limit <= 0) continue;
    const crossed = highestCrossedThreshold(cat.percentage, params.budgetStyle);
    if (crossed === null) continue;

    const lastNotified = state[cat.categoryId] ?? 0;
    if (crossed <= lastNotified) continue;

    const title =
      cat.percentage >= 100
        ? t('profileSettings.alertOverBudgetTitle')
        : t('profileSettings.alertThresholdTitle');
    const body =
      cat.percentage >= 100
        ? t('profileSettings.alertOverBudgetBody', { category: cat.name })
        : t('profileSettings.alertThresholdBody', {
            category: cat.name,
            percent: String(cat.percentage),
          });

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: false,
      },
      trigger: null,
    });

    state[cat.categoryId] = crossed;
    changed = true;
  }

  if (changed) {
    await saveAlertState(params.userId, state);
  }
}

export async function configureNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('budget-alerts', {
      name: 'Budget alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}
