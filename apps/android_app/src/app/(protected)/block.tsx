import '@/lib/polyfill';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
  Platform,
  AppState,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { colors, fonts, spacing } from '@/components/ui/theme';
import { syncRules, unlockApp } from '@/lib/enforcer';
import { orpcClient } from '@/lib/orpc';
import { forfeitAmount, formatMoney, minutesUntilMidnight, type CurrencyCode } from '@screen/monetization';
import ScreenlyEnforcer from '@/modules/screenly-enforcer/src/ScreenlyEnforcerModule';

type BlockRule = {
  id: string;
  lockedAmount: number | null;
  stakeCurrency: CurrencyCode | null;
  challengeEndsAt: string | Date | null;
  stakeStatus: 'active' | 'settled' | 'forfeited';
  forfeitedAmount: number;
};

export default function BlockScreen() {

  const { packageName, appName, ruleId } = useLocalSearchParams<{ packageName: string; appName: string; ruleId: string }>();

  const ownPackage = Constants.expoConfig?.android?.package;
  const dismissed = useRef(false);
  const [loading, setLoading] = useState(false);
  const [iconUri, setIconUri] = useState<string | null>(null);
  const [rule, setRule] = useState<BlockRule | null>(null);

  useEffect(() => {
    if (!packageName) return;
    const loadIcon = async () => {
      try {
        const str: string = await ScreenlyEnforcer.getAppIcons(JSON.stringify([packageName]));
        const map = JSON.parse(str);
        if (map[packageName]) setIconUri(map[packageName]);
      } catch (err: any) {
        console.log('[Block] getAppIcons error:', err?.message);
      }
    };
    loadIcon();
  }, [packageName]);

  // The block screen is opened by the accessibility service as a deep link, so
  // the stake isn't passed along with it — fetch the rule to show what giving
  // in actually costs.
  useEffect(() => {
    if (!ruleId) return;
    orpcClient
      .listRules({})
      .then((rules) => {
        const match = (rules as unknown as BlockRule[]).find((r) => r.id === ruleId);
        if (match) setRule(match);
      })
      .catch(() => {});
  }, [ruleId]);

  function goHome() {
    if (dismissed.current) return;
    dismissed.current = true;
    router.replace('/(protected)/(tabs)' as any);
  }

  // Block back button — trap user on this screen
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Auto-dismiss when Screenly opens but the blocked app is no longer in foreground
  useEffect(() => {
    if (!Platform.OS || !packageName) return;
    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      try {
        const fg = await ScreenlyEnforcer.getForegroundApp();
        if (fg && fg !== packageName && fg !== ownPackage) {
          goHome();
        }
      } catch { }
    });
    return () => sub.remove();
  }, [packageName]);

  const stakeMinor = rule?.lockedAmount ?? 0;
  const currency = rule?.stakeCurrency ?? 'INR';
  const unlockCost = forfeitAmount(stakeMinor, 'unlock');
  const giveUpCost = forfeitAmount(stakeMinor, 'forceUnlock');
  const unlockUsed = (rule?.forfeitedAmount ?? 0) > 0;
  const daysLeft = rule?.challengeEndsAt
    ? Math.max(0, Math.ceil((new Date(rule.challengeEndsAt).getTime() - Date.now()) / 86_400_000))
    : null;

  /** One temporary unlock per challenge: a slice of the stake is forfeited. */
  async function handleUnlock() {
    if (!packageName || !ruleId) return;
    setLoading(true);
    try {
      await orpcClient.unlockChallenge({ id: ruleId });
      await unlockApp(packageName);
      goHome();
    } catch (e: any) {
      console.error('[BlockScreen - Unlock Failed]', e);
      Alert.alert('Unlock failed', e?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /** Walking away forfeits the whole stake. */
  async function handleGiveIn() {
    if (!ruleId) return;
    Alert.alert(
      'Give up?',
      stakeMinor > 0
        ? `You lose the full ${formatMoney(giveUpCost, currency)} you staked on ${appName}. It stays with us.`
        : `You'll remove the restriction on ${appName}. Are you sure?`,
      [
        { text: 'Stay strong', style: 'cancel' },
        {
          text: 'I give up',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await orpcClient.giveUpChallenge({ id: ruleId });
              await syncRules();
              goHome();
            } catch (e: any) {
              console.error('[BlockScreen - GiveUp Failed]', e);
              Alert.alert('Could not give up', e?.message ?? 'Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.iconWrap}>
        {iconUri ? (
          <Image source={{ uri: iconUri }} style={styles.appIconImage} />
        ) : (
          <View style={styles.appIcon}>
            <Text style={styles.appIconText}>{(appName ?? 'A')[0]}</Text>
          </View>
        )}
        <Text style={styles.appName}>{appName}</Text>
        <Text style={styles.blockedLabel}>This app is blocked</Text>
      </View>
      {stakeMinor > 0 && (
        <View style={styles.stakeCard}>
          <Text style={styles.stakeLabel}>YOUR STAKE</Text>
          <Text style={styles.stakeAmount}>{formatMoney(stakeMinor, currency)}</Text>
          <Text style={styles.stakeHint}>
            {daysLeft !== null && daysLeft > 0
              ? `Back in full in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — as long as you don't break the lock.`
              : 'Complete the challenge and get the full amount back.'}
          </Text>
        </View>
      )}

      <View style={styles.btnRow}>
        <TouchableOpacity onPress={goHome} style={styles.backBtn}>
          <Text style={styles.backText}>Back to home</Text>
        </TouchableOpacity>
        {stakeMinor > 0 && !unlockUsed && (
          <TouchableOpacity onPress={handleUnlock} disabled={loading} style={styles.unlockBtn}>
            <Text style={styles.unlockText}>
              Unlock till midnight{'\n'}
              <Text style={styles.unlockCost}>−{formatMoney(unlockCost, currency)}</Text>
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleGiveIn} disabled={loading} style={styles.giveInBtn}>
          <Text style={styles.giveInText}>I give up</Text>
          {stakeMinor > 0 && <Text style={styles.giveInSub}>−{formatMoney(giveUpCost, currency)}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appIconImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  appIconText: { fontFamily: fonts.bold, fontSize: 36, color: colors.primary },
  appName: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  blockedLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.danger,
    marginTop: 4,
  },
  giveInBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  stakeCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  stakeLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  stakeAmount: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.text,
    marginTop: spacing.xs,
  },
  stakeHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 19,
  },
  unlockBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  unlockText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
  unlockCost: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  giveInText: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.danger,
  },
  giveInSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  backBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  backText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },
});

export { };  // needed because we have a default export
