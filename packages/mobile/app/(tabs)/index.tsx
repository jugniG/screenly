import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { authClient } from '../../lib/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RuleBadge } from '../../components/ui/RuleBadge';
import { colors, fonts, spacing } from '../../components/ui/theme';
import { API_BASE } from '../../lib/config';

interface TodayUsage {
  packageName: string;
  appName: string;
  totalMinutes: number;
  blocked: boolean;
}

interface Rule {
  id: string;
  packageName: string;
  appName: string;
  ruleType: 'daily_limit' | 'schedule' | 'block_always';
  limitMinutes: number | null;
}

export default function DashboardScreen() {
  const { data: session } = authClient.useSession();
  const [usage, setUsage]     = useState<TodayUsage[]>([]);
  const [rules, setRules]     = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const [usageRes, rulesRes] = await Promise.all([
        fetch(`${API_BASE}/api/usage/today`, { headers, credentials: 'include' }),
        fetch(`${API_BASE}/api/rules`,        { headers, credentials: 'include' }),
      ]);
      if (usageRes.ok) setUsage(await usageRes.json());
      if (rulesRes.ok) setRules(await rulesRes.json());
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalMinutes = usage.reduce((s, u) => s + u.totalMinutes, 0);
  const blockedCount = usage.filter(u => u.blocked).length;

  const topApps = [...usage].sort((a, b) => b.totalMinutes - a.totalMinutes).slice(0, 4);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getGreeting()},</Text>
          <Text style={styles.name}>{session?.user?.name ?? 'there'} 👋</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-rule')}>
          <Text style={styles.addBtnText}>+ Rule</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <>
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{formatMinutes(totalMinutes)}</Text>
              <Text style={styles.statLabel}>Total Today</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.danger }]}>{blockedCount}</Text>
              <Text style={styles.statLabel}>Blocked</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{rules.length}</Text>
              <Text style={styles.statLabel}>Rules</Text>
            </Card>
          </View>

          {/* Top Apps */}
          {topApps.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Apps Today</Text>
              {topApps.map(app => (
                <Card key={app.packageName} style={styles.appRow} padding="sm">
                  <View style={styles.appRowInner}>
                    <View style={styles.appIconPlaceholder}>
                      <Text style={styles.appIconText}>{app.appName[0]}</Text>
                    </View>
                    <View style={styles.appInfo}>
                      <Text style={styles.appName}>{app.appName}</Text>
                      {app.blocked && <Text style={styles.blockedTag}>Blocked</Text>}
                    </View>
                    <Text style={styles.appTime}>{formatMinutes(app.totalMinutes)}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, (app.totalMinutes / Math.max(totalMinutes, 1)) * 100)}%`,
                          backgroundColor: app.blocked ? colors.danger : colors.primary,
                        },
                      ]}
                    />
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* Rules */}
          {rules.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Rules</Text>
              {rules.slice(0, 3).map(rule => (
                <Card key={rule.id} style={styles.ruleRow} padding="sm">
                  <View style={styles.ruleRowInner}>
                    <Text style={styles.ruleName}>{rule.appName}</Text>
                    <RuleBadge
                      type={rule.ruleType}
                      value={rule.ruleType === 'daily_limit' && rule.limitMinutes
                        ? `${rule.limitMinutes}m`
                        : undefined}
                    />
                  </View>
                </Card>
              ))}
              {rules.length > 3 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/apps')}>
                  <Text style={styles.viewAll}>View all {rules.length} rules →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Empty state */}
          {rules.length === 0 && usage.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📱</Text>
              <Text style={styles.emptyTitle}>No rules yet</Text>
              <Text style={styles.emptySubtitle}>Add your first rule to start controlling your screen time</Text>
              <Button title="Add First Rule" onPress={() => router.push('/add-rule')} style={{ marginTop: spacing.lg }} />
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  greeting: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  name: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  addBtnText: { fontFamily: fonts.semiBold, fontSize: 13, color: '#fff' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  appRow: { marginBottom: spacing.sm },
  appRowInner: { flexDirection: 'row', alignItems: 'center' },
  appIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  appIconText: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  appInfo: { flex: 1 },
  appName: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  blockedTag: { fontFamily: fonts.regular, fontSize: 11, color: colors.danger },
  appTime: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textSecondary },
  progressBar: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  ruleRow: { marginBottom: spacing.sm },
  ruleRowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ruleName: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  viewAll: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 260,
  },
});
