import '@/lib/polyfill';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  BackHandler,
  Platform,
  AppState,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { syncRules } from '@/lib/enforcer';
import { orpcClient } from '@/lib/orpc';
import { forfeitAmount, formatMoney, type CurrencyCode } from '@screen/monetization';
import ScreenlyEnforcer from '@/modules/screenly-enforcer/src/ScreenlyEnforcerModule';

type BlockRule = {
  id: string;
  lockedAmount: number | null;
  stakeCurrency: CurrencyCode | null;
  challengeEndsAt: string | Date | null;
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
  // the stake isn't passed along with it - fetch the rule to show what giving
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
    router.dismissTo('/(protected)/(tabs)/limits' as any);
  }

  // Block back button - trap user on this screen
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
  const forfeitCost = forfeitAmount(stakeMinor, 'forceUnlock');
  const daysLeft = rule?.challengeEndsAt
    ? Math.max(0, Math.ceil((new Date(rule.challengeEndsAt).getTime() - Date.now()) / 86_400_000))
    : null;

  /**
   * The one early exit. Unlocking before the deadline forfeits the whole stake,
   * so it always confirms with the exact amount rather than a vague warning.
   */
  function handleUnlock() {
    if (!ruleId) return;
    Alert.alert(
      'Unlock early?',
      stakeMinor > 0
        ? `You lose the full ${formatMoney(forfeitCost, currency)} you staked on ${appName}. Stay locked until the timer runs out and you get all of it back.`
        : `This removes the restriction on ${appName}.`,
      [
        { text: 'Stay strong', style: 'cancel' },
        {
          text: 'Unlock anyway',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await orpcClient.unlockChallenge({ id: ruleId });
              // No local unlock grant here. That wrote an expiry of midnight,
              // which re-blocked the app hours after the user had already
              // forfeited the whole stake. The rule is now disabled
              // server-side, so syncRules is what opens it.
              await syncRules();
              goHome();
            } catch (e: any) {
              console.error('[BlockScreen - Unlock Failed]', e);
              Alert.alert('Could not unlock', e?.message ?? 'Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-forest px-8">
      <View className="items-center mt-10 mb-[60px]">
        {iconUri ? (
          <Image source={{ uri: iconUri }} className="size-20 rounded-[20px] mb-4" />
        ) : (
          <View className="size-20 rounded-[20px] bg-lime items-center justify-center mb-4">
            <Text className="font-bold text-[36px] text-foreground">{(appName ?? 'A')[0]}</Text>
          </View>
        )}
        <Text className="font-bold text-xl text-on-forest">{appName}</Text>
        <Text className="font-regular text-sm text-danger-on-forest mt-1">This app is blocked</Text>
      </View>

      {stakeMinor > 0 && (
        <View className="items-center self-stretch bg-forest-lift border border-forest-border rounded-2xl py-6 px-8 mb-6">
          <Text className="font-semibold text-[11px] tracking-[1.2px] text-on-forest-dim">YOUR STAKE</Text>
          <Text className="font-bold text-[32px] text-on-forest mt-1">{formatMoney(stakeMinor, currency)}</Text>
          <Text className="font-regular text-[13px] text-on-forest-muted text-center leading-[19px] mt-1">
            {daysLeft !== null && daysLeft > 0
              ? `Back in full in ${daysLeft} day${daysLeft === 1 ? '' : 's'} - as long as you don't break the lock.`
              : 'Complete the challenge and get the full amount back.'}
          </Text>
        </View>
      )}

      <View className="flex-row gap-4 w-full mt-12">
        <TouchableOpacity onPress={goHome} className="flex-1 items-center justify-center py-3 rounded-xl border border-forest-border">
          <Text className="font-semibold text-sm text-on-forest-muted">Back to home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleUnlock} disabled={loading} className="flex-1 items-center justify-center py-3 rounded-xl bg-lime">
          <Text className="font-semibold text-[13px] text-forest text-center leading-[18px]">
            Unlock early{'\n'}
            {stakeMinor > 0 && (
              <Text className="font-bold text-[15px] text-forest">−{formatMoney(forfeitCost, currency)}</Text>
            )}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export { };  // needed because we have a default export
