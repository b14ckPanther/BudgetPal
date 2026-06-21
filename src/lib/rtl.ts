/**
 * RTL-aware layout helpers.
 */

import { useMemo } from 'react';
import { I18nManager, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useIsRtl } from '@/components/locale/LocaleProvider';

export function useRtlMirrorStyle(): ViewStyle {
  const isRtl = useIsRtl();
  return useMemo(
    () => (isRtl ? { transform: [{ scaleX: -1 }] } : {}),
    [isRtl]
  );
}

export function useDirectionalStyle<T extends ViewStyle | TextStyle>(
  ltr: T,
  rtl: T
): T {
  const isRtl = useIsRtl();
  return useMemo(() => (isRtl ? rtl : ltr), [isRtl, ltr, rtl]);
}

export function rtlAwareTextAlign(isRtl: boolean): TextStyle['textAlign'] {
  return isRtl ? 'right' : 'left';
}

export function writingDirectionForMixedContent(): TextStyle['writingDirection'] {
  return 'auto';
}

export function ltrIsolatedTextStyle(): TextStyle {
  return {
    writingDirection: 'ltr',
    textAlign: 'left',
  };
}

export function isSystemRtl(): boolean {
  return I18nManager.isRTL;
}

export const logical = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
