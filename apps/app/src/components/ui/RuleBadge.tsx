import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from './theme';

type RuleType = 'daily_limit' | 'schedule' | 'block_always';

interface RuleBadgeProps {
  type: RuleType;
  value?: string;
}

const RULE_CONFIG: Record<RuleType, { label: string; color: string; bg: string }> = {
  daily_limit: { label: 'Daily Limit', color: colors.primary, bg: colors.primaryLight },
  schedule:    { label: 'Schedule',    color: '#F59E0B', bg: '#FEF3C7' },
  block_always:{ label: 'Always Block',color: colors.danger, bg: '#FEE2E2' },
};

export function RuleBadge({ type, value }: RuleBadgeProps) {
  const config = RULE_CONFIG[type];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>
        {config.label}{value ? `: ${value}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
});
