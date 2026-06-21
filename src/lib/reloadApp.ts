/**
 * Reload the app after RTL/locale changes.
 * Avoids dynamic import('react-native') — that loads PushNotificationIOS and crashes Expo Go.
 */

import { DevSettings } from 'react-native';
import Constants from 'expo-constants';

export async function reloadApp(): Promise<void> {
  const inExpoGo = Constants.appOwnership === 'expo';

  if (__DEV__ || inExpoGo) {
    DevSettings.reload();
    return;
  }

  const Updates = await import('expo-updates');
  await Updates.reloadAsync();
}
