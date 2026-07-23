import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { authClient } from '../../lib/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, fonts, spacing } from '../../components/ui/theme';
import { orpc } from '../../lib/orpc';
import { API_BASE } from '../../lib/config';
import { syncRules } from '../../lib/enforcer';
import ScreenlyEnforcer from '../../modules/screenly-enforcer/src/ScreenlyEnforcerModule';

interface Rule {
  id: string;
  packageName: string;
  appName: string;
  ruleType: 'daily_limit' | 'schedule' | 'block_always';
  limitMinutes: number | null;
  period: 'daily' | 'hourly' | null;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  enabled: boolean;
  paymentStatus?: 'pending' | 'completed';
  paymentId?: string | null;
  lockedAmount?: number | null;
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

function lerpColor(progress: number) {
  const c1 = { r: 0xf3, g: 0x93, b: 0x5f };
  const c2 = { r: 0xef, g: 0x44, b: 0x44 };
  const r = Math.round(c1.r + (c2.r - c1.r) * progress);
  const g = Math.round(c1.g + (c2.g - c1.g) * progress);
  const b = Math.round(c1.b + (c2.b - c1.b) * progress);
  return `rgb(${r}, ${g}, ${b})`;
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

  const resumePayment = async (ruleId: string) => {
    if (!ruleId) return;
    try {
      const res = await orpc<any, { checkout_url: string }>('resumeRuleCheckout', { id: ruleId });
      await WebBrowser.openBrowserAsync(res.checkout_url, {
        showTitle: true,
        enableBarCollapsing: true,
      });
    } catch (err) {
      console.error('Failed to resume checkout', err);
      Alert.alert('Error', 'Failed to open payment screen. Please try again.');
    }
  };
  const [hasPermission, setHasPermission] = useState(true);

  async function load() {
    try {
      console.log('[Home] step1');
      const [rulesList, todayUsage] = await Promise.all([
        orpc<Record<string, never>, Rule[]>('listRules'),
        (async () => {
          console.log('[Home] calling getTodayUsage');
          try { const r = await ScreenlyEnforcer.getTodayUsage(); console.log('[Home] got:', JSON.stringify(r?.slice(0,2))); return r; }
          catch(e: any) { console.log('[Home] getTodayUsage error:', e?.message); return []; }
        })(),
      ]);
      console.log('[Home] step2 len=' + (todayUsage?.length ?? 'undef'));
      console.log('[Home] step4 count=' + rulesList.length);
      setRules(rulesList);
      syncRules();

        if (rulesList.length > 0) {
          console.log('[Home] step5');
          const pkgNames = JSON.stringify(rulesList.map((r: Rule) => r.packageName));
          // DIAG: check module functions
          console.log('[Home] isAppUnlocked:', !!ScreenlyEnforcer.isAppUnlocked, typeof ScreenlyEnforcer.isAppUnlocked);
          console.log('[Home] getAppIcons:', !!ScreenlyEnforcer.getAppIcons, typeof ScreenlyEnforcer.getAppIcons);
          console.log('[Home] unlockApp:', !!ScreenlyEnforcer.unlockApp, typeof ScreenlyEnforcer.unlockApp);
          console.log('[Home] updateRules:', !!ScreenlyEnforcer.updateRules, typeof ScreenlyEnforcer.updateRules);
          try {
            const iconsStr: string = await ScreenlyEnforcer.getAppIcons(pkgNames) as any;
            try { setIcons(JSON.parse(iconsStr)); } catch(e: any) { console.log('[Home] icons parse error:', e?.message); }
          } catch (e: any) {
            console.log('[Home] getAppIcons sync error:', e?.message);
          }
          console.log('[Home] step6');
          const unlockResults: (string | null)[] = [];
          for (const r of rulesList) {
            try {
              const unlocked = await ScreenlyEnforcer.isAppUnlocked(r.packageName);
              unlockResults.push(unlocked ? r.packageName : null);
            } catch (e: any) {
              console.log('[Home] unlock sync error:', r.packageName, e?.message);
              unlockResults.push(null);
            }
          }
          setUnlockedApps(new Set(unlockResults.filter(Boolean) as string[]));
        }
      console.log('[Home] step7');
      const mapped = (todayUsage || []).map((u: any) => ({ packageName: u.packageName, totalMinutes: u.totalMinutes }));
      console.log('[Home] step8 mapped:', JSON.stringify(mapped.slice(0,3)));
      setUsage(mapped);
      const perm = await ScreenlyEnforcer.hasUsageStatsPermission().catch(() => false);
      setHasPermission(perm);
      console.log('[Home] done, perm=' + perm);
    } catch (e: any) {
      console.log('[Home] ERROR:', e);
      const isUnauth = e?.message?.includes('Unauthorized') || e?.message?.includes('UNAUTHORIZED') || e?.status === 401;
      if (isUnauth) {
        authClient.signOut().catch(() => {});
      }
    }
    finally { setLoading(false); setRefreshing(false); console.log('[Home] finally loading=false'); }
  }

  useEffect(() => { load();console.log('aa');
   }, []);

  function getUsageFor(pkg: string) {
    return usage.find(u => u.packageName === pkg);
  }

  async function toggleRule(id: string, enabled: boolean) {
    try {
      await orpc('updateRule', { id, enabled: !enabled });
      setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !enabled } : r));
      syncRules();
    } catch (e) {
      console.error('[Home - toggleRule Failed]', e);
      Alert.alert('Error', 'Could not update app settings. Please try again.');
    }
  }

  async function deleteRule(id: string, appName: string) {
    Alert.alert(`Remove ${appName}?`, 'This will stop tracking this app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await orpc('deleteRule', { id });
            setRules(prev => prev.filter(r => r.id !== id));
            syncRules();
          } catch (e) {
            console.error('[Home - deleteRule Failed]', e);
            Alert.alert('Error', 'Could not remove app tracking. Please try again.');
          }
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
          <Text style={styles.name}>{session?.user?.name || session?.user?.email || 'there'} 👋</Text>
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

            const isPendingPayment = item.paymentStatus === 'pending';

            return (
              <Card style={[styles.appCard, (!item.enabled && !isPendingPayment) && styles.appCardDisabled, { marginVertical: 3 }]}>
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
                      {isPendingPayment ? (
                        <Text style={styles.pendingBadge}>Awaiting Payment</Text>
                      ) : (
                        <>
                          {isLimit && limitMin > 0 && (
                            <Text style={styles.limitLabel}>{formatMinutes(limitMin)} / {item.period === 'hourly' ? 'hr' : 'day'}</Text>
                          )}
                          {isSchedule && item.scheduleStart && item.scheduleEnd && (
                            <Text style={styles.limitLabel}>
                              {format12h(item.scheduleStart)} – {format12h(item.scheduleEnd)}
                            </Text>
                          )}
                          {isBlocked && (
                            <Text style={styles.blockedLabel}>Blocked</Text>
                          )}
                        </>
                      )}
                    </View>
                  </View>

                  {/* Row 2: progress bar (limit) or sub-info (schedule/blocked) */}
                  {isPendingPayment ? (
                    <View style={styles.pendingContainer}>
                      <Text style={styles.pendingText}>
                        Waiting for payment confirmation. If you already checked out, pull down to refresh.
                      </Text>
                      {item.paymentId && (
                        <TouchableOpacity
                          style={styles.payNowBtn}
                          onPress={() => resumePayment(item.id)}
                        >
                          <Text style={styles.payNowBtnText}>Resume Checkout</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <>
                      {isLimit && limitMin > 0 && (
                        <View style={styles.progressWrap}>
                          <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, {
                              width: `${progress * 100}%` as any,
                              backgroundColor: lerpColor(progress),
                            }]} />
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
                    </>
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
  apiUrl: { fontFamily: fonts.regular, fontSize: 9, color: '#555', marginTop: 2 },
  name: { fontFamily: fonts.bold, fontSize: 10, color: colors.text },
  emailSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(225,101,64,0.15)',
    shadowColor: '#e16540',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
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
    backgroundColor: colors.surfaceAlt,
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
  pendingBadge: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#e16540',
    backgroundColor: 'rgba(225,101,64,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingContainer: {
    marginTop: 4,
    gap: 8,
  },
  pendingText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  payNowBtn: {
    backgroundColor: '#e16540',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payNowBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#fff',
  },
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
