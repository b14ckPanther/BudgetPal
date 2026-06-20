/**
 * BudgetPal — Tabs Layout
 * Bottom tab navigator with 5 tabs: Agent, Budget, Activity, Reports, Profile.
 * Premium dark styling with Lucide icons.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Bot, Wallet, ClockArrowUp, ChartNoAxesCombined, User } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { t } from '@/lib/i18n';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSoft,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.medium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="agent"
        options={{
          title: t('tabs.agent'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Bot size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: t('tabs.budget'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Wallet size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: t('tabs.activity'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <ClockArrowUp size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('tabs.reports'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <ChartNoAxesCombined size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
