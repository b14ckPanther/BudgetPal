/**
 * Safe expo-splash-screen helpers.
 * hideAsync can throw after DevSettings.reload() in Expo Go when no native VC is registered.
 */

import * as SplashScreen from 'expo-splash-screen';

let preventPromise: Promise<boolean | void> | null = null;

export function preventSplashAutoHide(): void {
  if (!preventPromise) {
    preventPromise = SplashScreen.preventAutoHideAsync().catch(() => undefined);
  }
}

export async function hideSplashScreen(): Promise<void> {
  try {
    await preventPromise;
    await SplashScreen.hideAsync();
  } catch {
    // No registered splash VC — common after DevSettings.reload() in Expo Go.
  }
}
