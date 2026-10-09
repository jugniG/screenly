import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenlyEnforcer from '@/modules/screenly-enforcer/src/ScreenlyEnforcerModule';
import { orpcClient } from '@/lib/orpc';
import { syncRules } from '@/lib/enforcer';
import {
  formatMoney,
  formatDuration,
  type CurrencyCode,
  type DurationId,
} from '@screen/monetization';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BackButton } from '@/components/ui/BackButton';

type Rule = {
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
  lockedAmount?: number | null;
  stakeCurrency?: 'INR' | 'USD' | null;
  challengeDuration?: DurationId | null;
  challengeEndsAt?: string | null;
  stakeStatus?: 'active' | 'settled' | 'forfeited';
  forfeitedAmount?: number;
};

const DAY_MS = 86_400_000;

function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function format12h(t: string | null) {
  if (!t) return '—';
  return new Date(`1970-01-01T${t}`).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AppDetailScreen() {
  const { ruleId } = useLocalSearchParams<{ ruleId: string }>();
  const [rule, setRule] = useState<Rule | null>(null);
  const [iconUri, setIconUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!ruleId) return;
    try {
      const rules = (await orpcClient.listRules({})) as unknown as Rule[];
      const match = rules.find((r) => r.id === ruleId);
      if (!match) {
        // Gone from under us (deleted on another screen) — leave rather than show
        // an empty shell.
        router.dismissTo('/(protected)/(tabs)/limits' as any);
        return;
      }
      setRule(match);

      try {
        const map = JSON.parse(
          await ScreenlyEnforcer.getAppIcons(JSON.stringify([match.packageName])),
        );
        if (map[match.packageName]) setIconUri(map[match.packageName]);
      } catch {}
    } catch {
      setRule(null);
    } finally {
      setLoading(false);
    }
  }, [ruleId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleUnlock() {
    if (!rule) return;
    const stake = rule.lockedAmount ?? 0;
    const currency = (rule.stakeCurrency ?? 'INR') as CurrencyCode;
    const stillRunning = rule.challengeEndsAt
      ? new Date().getTime() < new Date(rule.challengeEndsAt).getTime()
      : false;

    Alert.alert(
      'Unlock early?',
      stake > 0
        ? stillRunning
          ? `You lose the full ${formatMoney(stake, currency)} staked on ${rule.appName}. Unlock it now, or wait for the challenge to finish and claim it all back.`
          : `The challenge is already over. Claim the refund instead — forfeiting now throws away ${formatMoney(stake, currency)}.`
        : `This removes the restriction on ${rule.appName}.`,
      [
        { text: 'Stay strong', style: 'cancel' },
        {
          text: 'Unlock anyway',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await orpcClient.unlockChallenge({ id: rule.id });
              await syncRules().catch(() => {});
              router.dismissTo('/(protected)/(tabs)/limits' as any);
            } catch (e: any) {
              Alert.alert('Could not unlock', e?.message ?? 'Please try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  function handleClaimRefund() {
    if (!rule) return;
    setBusy(true);
    (async () => {
      try {
        const res = (await orpcClient.settleChallenge({ id: rule.id })) as any;
        await syncRules().catch(() => {});
        const currency = (rule.stakeCurrency ?? 'INR') as CurrencyCode;
        Alert.alert(
          res.refundStatus === 'failed' ? 'Refund failed' : 'Refunded',
          res.refundStatus === 'failed'
            ? 'Google Play rejected the refund. Your stake is safe — please try again.'
            : `${formatMoney(res.refundedAmount, currency)} is on its way back to your account.`,
          [{ text: 'Done', onPress: () => router.dismissTo('/(protected)/(tabs)/limits' as any) }],
        );
      } catch (e: any) {
        Alert.alert('Could not refund', e?.message ?? 'Please try again.');
      } finally {
        setBusy(false);
      }
    })();
  }

  function handleRemove() {
    if (!rule) return;
    const stake = rule.lockedAmount ?? 0;
    const currency = (rule.stakeCurrency ?? 'INR') as CurrencyCode;
    // Matches the server rule in deleteRule: a paid challenge that is still
    // running is forfeited, not deleted.
    const forfeits = rule.paymentStatus === 'completed' && rule.stakeStatus === 'active' && stake > 0;

    Alert.alert(
      `Remove ${rule.appName}?`,
      forfeits
        ? `This challenge is still running, so removing it forfeits the full ${formatMoney(stake, currency)}. To keep your money, wait for the challenge to end and claim the refund first.`
        : 'This stops tracking the app and removes its limit.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: forfeits ? 'Remove and forfeit' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await orpcClient.deleteRule({ id: rule.id });
              await syncRules().catch(() => {});
              router.dismissTo('/(protected)/(tabs)/limits' as any);
            } catch (e: any) {
              Alert.alert('Could not remove', e?.message ?? 'Please try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-[13px] text-text-muted">Loading…</Text>
      </View>
    );
  }

  if (!rule) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-[13px] text-text-muted">Rule not found</Text>
        <Button
          title="Back"
          onPress={() => router.dismissTo('/(protected)/(tabs)/limits' as any)}
        />
      </View>
    );
  }

  const stake = rule.lockedAmount ?? 0;
  const currency = (rule.stakeCurrency ?? 'INR') as CurrencyCode;
  const duration = rule.challengeDuration ?? 'week';
  const endsAt = rule.challengeEndsAt ? new Date(rule.challengeEndsAt) : null;
  const msLeft = endsAt ? endsAt.getTime() - Date.now() : null;
  const isPendingPayment = rule.paymentStatus === 'pending';

  // A refund is only claimable when the challenge actually has an end date and
  // that date has passed. `challengeEndsAt` is null for rules that were never
  // paid for (payment still pending) and for pre-Play rows; treating those as
  // "elapsed" showed a Claim refund button for money that was never taken.
  const isRunning = rule.stakeStatus === 'active' && msLeft !== null && msLeft > 0;
  const isOver = rule.stakeStatus === 'active' && msLeft !== null && msLeft <= 0;
  const canClaim = stake > 0 && !isPendingPayment && isOver;
  const daysLeft = msLeft === null ? null : Math.max(0, Math.ceil(msLeft / DAY_MS));

  const endsLabel = endsAt
    ? endsAt.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) +
      ' at ' +
      endsAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="px-6 pt-6 pb-12">
        <BackButton onPress={() => router.dismissTo('/(protected)/(tabs)/limits' as any)} />

        <View className="items-center mb-5">
          {iconUri ? (
            <Image source={{ uri: iconUri }} className="w-16 h-16 rounded-2xl" />
          ) : (
            <View className="w-16 h-16 rounded-2xl bg-surface-alt items-center justify-center">
              <Text className="text-[26px] font-bold text-primary">{rule.appName[0]}</Text>
            </View>
          )}
          <Text className="text-[22px] font-bold text-text mt-2.5">{rule.appName}</Text>
          <Text className="text-[11px] text-text-muted">{rule.packageName}</Text>
        </View>

        <Card className="mb-3">
          <Text className="text-[11px] font-semibold tracking-[1.2] text-text-muted mb-1">LIMIT</Text>
          {rule.ruleType === 'daily_limit' && (
            <Text className="text-[20px] font-bold text-text">
              {rule.limitMinutes === 0
                ? 'Blocked now'
                : `${formatMinutes(rule.limitMinutes ?? 0)} / ${rule.period === 'hourly' ? 'hour' : 'day'}`}
            </Text>
          )}
          {rule.ruleType === 'schedule' && (
            <Text className="text-[20px] font-bold text-text">
              {format12h(rule.scheduleStart)} – {format12h(rule.scheduleEnd)}
            </Text>
          )}
          {rule.ruleType === 'block_always' && (
            <Text className="text-[20px] font-bold text-text">Always blocked</Text>
          )}
          <Text className="text-[12px] text-text-secondary mt-1">
            {isPendingPayment
              ? 'Payment not completed — this limit is not active.'
              : rule.enabled
                ? 'Active'
                : 'Not active'}
          </Text>
        </Card>

        {stake > 0 && (
          <Card className="mb-3">
            <Text className="text-[11px] font-semibold tracking-[1.2] text-text-muted mb-1">STAKE</Text>
            <Text className="text-[20px] font-bold text-text">
              {isPendingPayment ? 'Not paid' : formatMoney(stake, currency)}
            </Text>
            <Text className="text-[12px] text-text-secondary mt-1">
              {isPendingPayment
                ? 'Payment was never completed, so nothing was charged and there is nothing to claim.'
                : rule.stakeStatus === 'forfeited'
                  ? 'Forfeited.'
                  : rule.stakeStatus === 'settled'
                    ? 'Claimed back in full.'
                    : endsLabel
                      ? `Locked until ${endsLabel} — ${
                          daysLeft !== null
                            ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left.`
                            : ''
                        }`
                      : `Locked for ${formatDuration(duration)} — end date not set.`}
            </Text>
          </Card>
        )}

        {canClaim && (
          <Button
            title={busy ? 'Working…' : 'Claim refund'}
            onPress={handleClaimRefund}
            disabled={busy}
          />
        )}

        {!isPendingPayment && rule.stakeStatus === 'active' && (
          <TouchableOpacity
            className="mt-3"
            activeOpacity={0.7}
            disabled={busy}
            onPress={handleUnlock}
          >
            <Text className="text-[15px] font-semibold text-danger text-center">
              {busy ? 'Working…' : 'Unlock app early'}
            </Text>
          </TouchableOpacity>
        )}

        {stake > 0 && isRunning && !isPendingPayment && (
          <Text className="text-[12px] text-danger mt-2">
            Unlocking now forfeits the whole {formatMoney(stake, currency)}. Wait until the
            challenge ends to get it all back.
          </Text>
        )}

        <TouchableOpacity
          className="mt-5 py-3 rounded-xl border border-border active:opacity-70"
          activeOpacity={0.7}
          disabled={busy}
          onPress={handleRemove}
        >
          <Text className="text-[15px] font-semibold text-danger text-center">Remove app</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}