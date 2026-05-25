import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { authClient } from '../../lib/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, fonts, spacing } from '../../components/ui/theme';
import { apiFetch } from '../../lib/fetchApi';
import { syncRules } from '../../lib/enforcer';
import ScreenlyEnforcer from '../../modules/screenly-enforcer/src/ScreenlyEnforcerModule';

interface Rule {
  id: string;
  packageName: string;
  appName: string;
  ruleType: 'daily_limit' | 'schedule' | 'block_always';
  limitMinutes: number | null;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  enabled: boolean;
}

interface UsageInfo {
  packageName: string;
  totalMinutes: number;
}

function format12h(time24: string) {
  if (!/^\d{2}:\d{2}$/.test(time24)) return time24;
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function windowDuration(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  let diff = endMin - startMin;
  if (diff <= 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatMinutes(m: number) {
  if (m === 0) return '0m';
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}m`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}m`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export default function HomeScreen() {
  const { data: session } = authClient.useSession();
  const [rules, setRules] = useState<Rule[]>([]);
  const [usage, setUsage] = useState<UsageInfo[]>([]);
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [unlockedApps, setUnlockedApps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);

  async function load() {
    try {
      const [res, todayUsage] = await Promise.all([
        apiFetch('/api/rules'),
        Promise.resolve(ScreenlyEnforcer.getTodayUsage()).catch(() => []),
      ]);
      if (res.ok) {
        const rulesList = await res.json();
        setRules(rulesList);
        syncRules();

        if (rulesList.length > 0) {
          const pkgNames = JSON.stringify(rulesList.map((r: Rule) => r.packageName));
          const iconsStr: string = await ScreenlyEnforcer.getAppIcons(pkgNames) as any;
          try { setIcons(JSON.parse(iconsStr)); } catch {}

          // Check unlock status for each app
          const unlockResults = await Promise.all(
            rulesList.map((r: Rule) =>
              ScreenlyEnforcer.isAppUnlocked(r.packageName)
                .then((unlocked: boolean) => unlocked ? r.packageName : null)
                .catch(() => null)
            )
          );
          setUnlockedApps(new Set(unlockResults.filter(Boolean) as string[]));
        }
      }
      setUsage((todayUsage || []).map((u: any) => ({ packageName: u.packageName, totalMinutes: u.totalMinutes })));
      const perm = await ScreenlyEnforcer.hasUsageStatsPermission().catch(() => false);
      setHasPermission(perm);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { load(); }, []);

  function getUsageFor(pkg: string) {
    return usage.find(u => u.packageName === pkg);
  }

  async function toggleRule(id: string, enabled: boolean) {
    try {
      await apiFetch(`/api/rules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !enabled }),
      });
      setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !enabled } : r));
      syncRules();
    } catch {
      Alert.alert('Error', 'Could not update app');
    }
  }

  async function deleteRule(id: string, appName: string) {
    Alert.alert(`Remove ${appName}?`, 'This will stop tracking this app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/rules/${id}`, { method: 'DELETE' });
            setRules(prev => prev.filter(r => r.id !== id));
            syncRules();
          } catch { Alert.alert('Error', 'Could not remove app'); }
        },
      },
    ]);
  }

  const GR = getGreeting();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {GR},</Text>
          <Text style={styles.name}>{session?.user?.name ?? 'there'} 👋</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-rule')}>
          <Text style={styles.addBtnText}>+ Add App</Text>
        </TouchableOpacity>
      </View>

      {!hasPermission && (
        <TouchableOpacity
          style={styles.permBanner}
          onPress={() => ScreenlyEnforcer.requestUsageStatsPermission()}
          activeOpacity={0.8}
        >
          <Text style={styles.permBannerIcon}>⚠️</Text>
          <View style={styles.permBannerTextWrap}>
            <Text style={styles.permBannerTitle}>Usage access needed</Text>
            <Text style={styles.permBannerSub}>Tap to open Settings</Text>
          </View>
        </TouchableOpacity>
      )}

      {rules.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📱</Text>
          <Text style={styles.emptyTitle}>No apps yet</Text>
          <Text style={styles.emptySubtitle}>Add apps you want to track and set restrictions</Text>
          <Button title="Add First App" onPress={() => router.push('/add-rule')} style={{ marginTop: spacing.lg }} />
        </View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => {
            const u = getUsageFor(item.packageName);
            const iconUri = icons[item.packageName];
            const usedMin = u?.totalMinutes ?? 0;
            const limitMin = item.limitMinutes ?? 0;
            const progress = limitMin > 0 ? Math.min(usedMin / limitMin, 1) : 0;
            const limitReached = limitMin > 0 && usedMin >= limitMin;
            const isBlocked = item.ruleType === 'block_always';
            const isSchedule = item.ruleType === 'schedule';
            const isLimit = item.ruleType === 'daily_limit';
            const isUnlocked = unlockedApps.has(item.packageName);

            return (
              <Card style={[styles.appCard, !item.enabled && styles.appCardDisabled,{marginVertical:3}]}>
                  {/* Row 1: icon + name + delete + right info */}
                  <View style={styles.cardRow}>
                    {iconUri ? (
                      <Image source={{ uri: iconUri }} style={styles.appIcon} />
                    ) : (
                      <View style={styles.appIconPlaceholder}>
                        <Text style={styles.appIconText}>{item.appName[0]}</Text>
                      </View>
                    )}
                    <Text style={styles.appName}>{item.appName}</Text>
                    <View style={styles.rightInfo}>
                      {isLimit && limitMin > 0 && (
                        <Text style={styles.limitLabel}>{formatMinutes(limitMin)} / day</Text>
                      )}
                      {isSchedule && item.scheduleStart && item.scheduleEnd && (
                        <Text style={styles.limitLabel}>
                          {format12h(item.scheduleStart)} – {format12h(item.scheduleEnd)}
                        </Text>
                      )}
                      {isBlocked && (
                        <Text style={styles.blockedLabel}>Blocked</Text>
                      )}
                    </View>
                  </View>

                  {/* Row 2: progress bar (limit) or sub-info (schedule/blocked) */}
                  {isLimit && limitMin > 0 && (
                    <View style={styles.progressWrap}>
                      <View style={styles.progressTrack}>
                        <LinearGradient
                          colors={limitReached ? ['#EF4444', '#DC2626'] : ['#ff910065', '#f3935fce']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressFill, { width: `${progress * 100}%` as any }]}
                        />
                      </View>
                      <Text style={[styles.usedLabel, limitReached && styles.limitReachedLabel]}>
                        {limitReached ? 'Limit reached' : `${formatMinutes(usedMin)} used`}
                      </Text>
                    </View>
                  )}
                  {isSchedule && item.scheduleStart && item.scheduleEnd && (
                    <View style={styles.scheduleRow}>
                      <Text style={styles.scheduleSubtitle}>Time window</Text>
                      <Text style={styles.scheduleDuration}>{windowDuration(item.scheduleStart, item.scheduleEnd)}/day</Text>
                    </View>
                  )}
                  {isUnlocked && (
                    <View style={styles.unlockedBadge}>
                      <Text style={styles.unlockedText}>Unlocked until midnight</Text>
                    </View>
                  )}
                </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  name: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderColor:colors.borderSoft,
    borderWidth:1
  },
  addBtnText: { fontFamily: fonts.semiBold, fontSize: 13, color: '#fff' },
  list: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.xxl },
  appCard: { gap: spacing.sm },
  appCardDisabled: { opacity: 0.5 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  appIcon: { width: 44, height: 44, borderRadius: 12, marginRight: spacing.sm },
  appIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  appIconText: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary },
  appName: { flex: 1, fontFamily: fonts.semiBold, fontSize: 15, color: colors.text },
  rightInfo: { alignItems: 'flex-end' },
  limitLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text },
  blockedLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.danger },
  progressWrap: { gap: 4 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  usedLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textSecondary, textAlign: 'right' },
  limitReachedLabel: { color: colors.danger },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleSubtitle: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textSecondary },
  scheduleDuration: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textSecondary },
  unlockedBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#1A2E1A',
    borderWidth: 1,
    borderColor: '#2D5A2D',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unlockedText: { fontFamily: fonts.semiBold, fontSize: 11, color: '#4ADE80' },
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: '#2D1B00',
    borderWidth: 1,
    borderColor: '#7C4400',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  permBannerIcon: { fontSize: 18, marginRight: spacing.sm },
  permBannerTextWrap: { flex: 1 },
  permBannerTitle: { fontFamily: fonts.semiBold, fontSize: 13, color: '#FFB347' },
  permBannerSub: { fontFamily: fonts.regular, fontSize: 12, color: '#CC8800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  emptySubtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
});
