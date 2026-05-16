import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { colors, fonts, spacing } from '../../components/ui/theme';
import ScreenlyEnforcer from '../../modules/screenly-enforcer/src/ScreenlyEnforcerModule';

const BAR_MAX_H = 120;

interface DayUsage {
  date: string;
  totalMinutes: number;
  appBreakdown: { appName: string; packageName: string; minutes: number }[];
}

export default function StatsScreen() {
  const [data, setData]       = useState<DayUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const todayUsage = await ScreenlyEnforcer.getTodayUsage();
      const days: DayUsage[] = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        if (i === 6) {
          return {
            date: d.toISOString().split('T')[0],
            totalMinutes: todayUsage.reduce((s, a) => s + a.totalMinutes, 0),
            appBreakdown: todayUsage.map(a => ({ appName: a.appName, packageName: a.packageName, minutes: a.totalMinutes })),
          };
        }
        return { date: d.toISOString().split('T')[0], totalMinutes: 0, appBreakdown: [] };
      });
      setData(days);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { load(); }, []);

  const maxMinutes = Math.max(...data.map(d => d.totalMinutes), 60);
  const today = data[data.length - 1];
  const totalToday = today?.totalMinutes ?? 0;
  const weekTotal = data.reduce((s, d) => s + d.totalMinutes, 0);
  const weekAvg   = Math.round(weekTotal / 7);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <Text style={styles.title}>Stats</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <>
          {/* Summary */}
          <View style={styles.row}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatMinutes(totalToday)}</Text>
              <Text style={styles.summaryLabel}>Today</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatMinutes(weekAvg)}</Text>
              <Text style={styles.summaryLabel}>Daily Avg</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatMinutes(weekTotal)}</Text>
              <Text style={styles.summaryLabel}>This Week</Text>
            </Card>
          </View>

          {/* Bar Chart */}
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Last 7 Days</Text>
            <View style={styles.bars}>
              {data.map((d, i) => {
                const barH = Math.max(4, (d.totalMinutes / maxMinutes) * BAR_MAX_H);
                const isToday = i === 6;
                return (
                  <View key={d.date} style={styles.barCol}>
                    <Text style={styles.barValue}>
                      {d.totalMinutes > 0 ? formatMinutesShort(d.totalMinutes) : ''}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          { height: barH, backgroundColor: isToday ? colors.primary : colors.primaryLight },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, isToday && { color: colors.primary, fontFamily: fonts.semiBold }]}>
                      {getDayLabel(d.date, isToday)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Today breakdown */}
          {today?.appBreakdown && today.appBreakdown.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Breakdown</Text>
              {today.appBreakdown
                .sort((a, b) => b.minutes - a.minutes)
                .map(app => (
                  <Card key={app.packageName} style={styles.appRow} padding="sm">
                    <View style={styles.appRowTop}>
                      <View style={styles.appIconPlaceholder}>
                        <Text style={styles.appIconText}>{app.appName[0]}</Text>
                      </View>
                      <Text style={styles.appName}>{app.appName}</Text>
                      <Text style={styles.appTime}>{formatMinutes(app.minutes)}</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${(app.minutes / Math.max(totalToday, 1)) * 100}%` },
                        ]}
                      />
                    </View>
                  </Card>
                ))}
            </View>
          )}

          {totalToday === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={styles.emptyTitle}>No data yet</Text>
              <Text style={styles.emptySubtitle}>Usage will appear here once the app starts tracking</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatMinutesShort(m: number) {
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

function getDayLabel(dateStr: string, isToday: boolean) {
  if (isToday) return 'Today';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(dateStr).getDay()];
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.text, marginBottom: spacing.lg, marginTop: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  summaryCard: { flex: 1, alignItems: 'center' },
  summaryValue: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  summaryLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  chartCard: { marginBottom: spacing.xl },
  chartTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text, marginBottom: spacing.md },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: BAR_MAX_H + 40 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { fontFamily: fonts.regular, fontSize: 9, color: colors.textMuted, marginBottom: 2 },
  barTrack: { width: '60%', height: BAR_MAX_H, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text, marginBottom: spacing.sm },
  appRow: { marginBottom: spacing.sm },
  appRowTop: { flexDirection: 'row', alignItems: 'center' },
  appIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  appIconText: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  appName: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  appTime: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textSecondary },
  progressBar: { height: 3, backgroundColor: colors.border, borderRadius: 2, marginTop: spacing.sm, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: colors.primary },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  emptySubtitle: {
    fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary,
    textAlign: 'center', marginTop: spacing.sm, maxWidth: 260,
  },
});
