import '@/lib/polyfill';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import AppPicker from '@/components/ui/AppPicker';
import { colors, fonts, spacing, radius } from '@/components/ui/theme';
import { orpc, orpcClient } from '@/lib/orpc';
import { authClient } from '@/lib/auth';
import { BackButton } from '@/components/ui/BackButton';
import { syncRules } from '@/lib/enforcer';
import { getStakeTiers, purchaseStake, type StakeTier } from '@/lib/purchases';
import {
  CHALLENGE_DURATIONS,
  formatDuration,
  DEFAULT_DURATION_ID,
  DEFAULT_TIER_ID,
  isFreeTier,
  type CurrencyCode,
  type DurationId,
} from '@screen/monetization';

type RuleType = 'daily_limit' | 'schedule' | 'block_always';
type Step = 'app' | 'type' | 'configure' | 'deposit' | 'done';

interface RuleTypeOption {
  value: RuleType;
  label: string;
  desc: string;
  emoji: string;
}

const RULE_TYPES: RuleTypeOption[] = [
  { value: 'daily_limit',  label: 'Daily Limit',   desc: 'Only open for X minutes per day',       emoji: '⏱️' },
  { value: 'schedule',     label: 'Time Schedule',  desc: 'Allow only between specific hours',     emoji: '🗓️' },
  { value: 'block_always', label: 'Always Block',   desc: 'Permanently block the app',            emoji: '🚫' },
];

export default function AddRuleScreen() {
  const [step, setStep]             = useState<Step>('app');
  const [packageName, setPackageName] = useState('');
  const [appName, setAppName]       = useState('');
  const [ruleType, setRuleType]     = useState<RuleType>('daily_limit');
  const [limitMinutes, setLimitMinutes] = useState('60');
  const [startH, setStartH] = useState('10');
  const [startM, setStartM] = useState('00');
  const [startP, setStartP] = useState<'PM' | 'AM'>('PM');
  const [endH, setEndH] = useState('7');
  const [endM, setEndM] = useState('00');
  const [endP, setEndP] = useState<'AM' | 'PM'>('AM');
  const [loading, setLoading]       = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingRule, setPendingRule] = useState<{
    packageName: string;
    appName: string;
    ruleType: RuleType;
    limitMinutes?: number;
    period?: 'daily' | 'hourly';
    scheduleStart?: string;
    scheduleEnd?: string;
  } | null>(null);
  const [period, setPeriod]         = useState<'daily' | 'hourly'>('daily');
  const [depositing, setDepositing] = useState(false);
  const [durationId, setDurationId]   = useState<DurationId>(DEFAULT_DURATION_ID);
  const [statusText, setStatusText] = useState('');
  // Play prices the stake tiers, so the amount is a price the store reports,
  // never something the user types.
  const [stakeTiers, setStakeTiers] = useState<StakeTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<StakeTier | null>(null);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [existingPackages, setExistingPackages] = useState<string[]>([]);
  const { data: session } = authClient.useSession() as any;

  useEffect(() => {
    if (!session) return;
    orpc<Record<string, never>, { packageName: string }[]>('listRules')
      .then(rules => setExistingPackages(rules.map(r => r.packageName)))
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    AsyncStorage.getItem('pending_add_rule').then(raw => {
      if (!raw) return;
      AsyncStorage.removeItem('pending_add_rule');
      try {
        const draft = JSON.parse(raw);
        if (!draft.packageName) return;
        setPackageName(draft.packageName);
        setAppName(draft.appName || '');
        if (draft.ruleType) setRuleType(draft.ruleType);
        // `!= null` rather than a truthy check: a limit of 0 is valid and means
        // "block immediately", and `if (draft.limitMinutes)` silently drops it.
        if (draft.limitMinutes != null) setLimitMinutes(String(draft.limitMinutes));
        if (draft.period) setPeriod(draft.period);
        if (draft.startH) setStartH(draft.startH);
        if (draft.startM) setStartM(draft.startM);
        if (draft.startP) setStartP(draft.startP);
        if (draft.endH) setEndH(draft.endH);
        if (draft.endM) setEndM(draft.endM);
        if (draft.endP) setEndP(draft.endP);
        if (draft.durationId) setDurationId(draft.durationId);
        // Never restore past 'configure'. The deposit and done steps both need an
        // account, so restoring them would land a signed-out user on a screen
        // whose only action is a purchase.
        setStep(draft.step === 'app' ? 'app' : 'configure');
      } catch {}
    });
  }, []);

  async function handleLoginRedirect() {
    await AsyncStorage.setItem('pending_add_rule', JSON.stringify({
      packageName,
      appName,
      ruleType,
      limitMinutes,
      period,
      startH,
      startM,
      startP,
      endH,
      endM,
      endP,
      durationId,
      step,
    }));
    router.push({
      pathname: '/(auth)/sign-in' as any,
      params: { returnTo: '/add-rule' },
    });
  }

  // Read the stake prices from Play while the user fills in the earlier steps,
  // so the deposit screen shows what the store will actually charge.
  useEffect(() => {
    if (step !== 'deposit') return;
    let cancelled = false;
    getStakeTiers().then(tiers => {
      if (cancelled) return;
      setStakeTiers(tiers);
      // Prefer DEFAULT_TIER_ID, not tiers[0] — the free tier is listed first, and
      // taking position zero auto-selected "no stake" for every new challenge.
      setSelectedTier(prev => {
        if (prev && tiers.some(t => t.id === prev.id)) return prev;
        return tiers.find(t => t.id === DEFAULT_TIER_ID) ?? tiers.find(t => !isFreeTier(t.id)) ?? null;
      });
    });
    return () => { cancelled = true; };
  }, [step]);

  function handleAppSelected(app: { name: string; packageName: string }) {
    setAppName(app.name);
    setPackageName(app.packageName);
    setShowPicker(false);
    setStep('type');
  }

  function to24h(h: string, m: string, p: 'AM' | 'PM') {
    let hh = parseInt(h) || 0;
    if (p === 'AM' && hh === 12) hh = 0;
    if (p === 'PM' && hh !== 12) hh += 12;
    return `${String(hh).padStart(2, '0')}:${m.padStart(2, '0')}`;
  }

  function validateConfigure() {
    const e: Record<string, string> = {};
    if (ruleType === 'daily_limit') {
      const m = parseInt(limitMinutes);
      if (isNaN(m) || m < 0) e.limitMinutes = 'Enter 0 or more minutes';
    }
    if (ruleType === 'schedule') {
      const sh = parseInt(startH);
      const sm = parseInt(startM);
      const eh = parseInt(endH);
      const em = parseInt(endM);
      if (isNaN(sh) || sh < 1 || sh > 12) e.startH = 'Hour 1-12';
      if (isNaN(sm) || sm < 0 || sm > 59) e.startM = 'Minute 0-59';
      if (isNaN(eh) || eh < 1 || eh > 12) e.endH = 'Hour 1-12';
      if (isNaN(em) || em < 0 || em > 59) e.endM = 'Minute 0-59';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function hasConfigureErrors() {
    if (ruleType === 'daily_limit') {
      const m = parseInt(limitMinutes);
      return isNaN(m) || m < 0;
    }
    if (ruleType === 'schedule') {
      const sh = parseInt(startH);
      const sm = parseInt(startM);
      const eh = parseInt(endH);
      const em = parseInt(endM);
      return isNaN(sh) || sh < 1 || sh > 12 ||
             isNaN(sm) || sm < 0 || sm > 59 ||
             isNaN(eh) || eh < 1 || eh > 12 ||
             isNaN(em) || em < 0 || em > 59;
    }
    return false;
  }

  /**
   * Creates the rule with no stake at all.
   *
   * The stake is optional by design: someone who wants Instagram limited should
   * not be forced into a payment to do it. This path never touches Play — it
   * goes straight to createRule, so nothing is charged and no challenge clock
   * is started.
   */
  async function handleSkipStake() {
    if (!pendingRule) return;
    setDepositing(true);
    setStatusText('Adding app...');
    try {
      await orpc('createRule', {
        packageName: pendingRule.packageName,
        appName: pendingRule.appName,
        ruleType: pendingRule.ruleType,
        limitMinutes: pendingRule.limitMinutes ?? undefined,
        period: pendingRule.period || 'daily',
        scheduleStart: pendingRule.scheduleStart,
        scheduleEnd: pendingRule.scheduleEnd,
        enabled: true,
      });
      await syncRules().catch(() => {});
      setStep('done');
    } catch (e: any) {
      Alert.alert('Could not add app', e?.message ?? 'Please try again.');
    } finally {
      setDepositing(false);
      setStatusText('');
    }
  }

  async function submit() {
    if (!validateConfigure()) return;
    setLoading(true);
    try {
      const pending: any = {
        packageName,
        appName,
        ruleType,
      };
      if (ruleType === 'daily_limit') {
        pending.limitMinutes = parseInt(limitMinutes);
        pending.period = period;
      }
      if (ruleType === 'schedule') {
        pending.scheduleStart = to24h(startH, startM, startP);
        pending.scheduleEnd = to24h(endH, endM, endP);
      }
      setPendingRule(pending);
      setStep('deposit');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    if (!selectedTier) {
      Alert.alert('Choose an amount', 'Pick how much you want to stake first.');
      return;
    }
    // ₹0 means no money and no challenge, so it never touches Play.
    if (isFreeTier(selectedTier.id)) {
      await handleSkipStake();
      return;
    }
    if (!pendingRule) {
      throw new Error('No pending rule configuration found');
    }

    setDepositing(true);
    setStatusText('Reserving your challenge...');
    try {
      // The rule is created first, disabled, and only activated once Google
      // confirms the payment. Doing it in this order means a paid purchase is
      // never orphaned: the rule holding the stake tier already exists if the
      // confirmation call fails and has to be retried.
      const { ruleId } = await orpcClient.beginStake({
        packageName: pendingRule.packageName,
        appName: pendingRule.appName,
        ruleType: pendingRule.ruleType,
        limitMinutes: pendingRule.limitMinutes ?? undefined,
        period: pendingRule.period || 'daily',
        scheduleStart: pendingRule.scheduleStart,
        scheduleEnd: pendingRule.scheduleEnd,
        tierId: selectedTier.id,
        durationId,
        currency: selectedTier.currency as CurrencyCode,
      });

      setStatusText('Opening Google Play...');
      const purchase = await purchaseStake(selectedTier.id, selectedTier.offerToken);
      if (!purchase.ok) {
        // Cancelled or failed — the rule stays disabled, nothing is charged.
        setDepositing(false);
        setStatusText('');
        console.error('[AddRule - Stake Purchase Failed]', purchase.message);
        if (!/cancel/i.test(purchase.message)) {
          Alert.alert('Purchase failed', purchase.message);
        }
        return;
      }

      setStatusText('Verifying payment...');
      await orpcClient.confirmStakePurchase({ ruleId, purchaseToken: purchase.token });

      await syncRules().catch(() => {});
      Alert.alert(
        'Locked in',
        `${selectedTier.displayPrice} is staked on ${pendingRule.appName}. Stay locked for ${formatDuration(durationId)} and you get all of it back.`,
      );
      router.dismissTo('/(protected)/(tabs)/limits' as any);
    } catch (e: any) {
      console.error('[AddRule - Stake Purchase Failed]', e);
      Alert.alert('Could not start the challenge', e?.message ?? 'Please try again.');
    } finally {
      setDepositing(false);
      setStatusText('');
    }
  }

  function goBack() {
    if (step === 'app') router.dismissTo('/(protected)/(tabs)/limits' as any);
    else if (step === 'type') setStep('app');
    else if (step === 'configure') setStep('type');
    else if (step === 'deposit') setStep('configure');
  }

  return (
    <View style={styles.flex}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <BackButton onPress={goBack} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {appName || 'Add App'}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Progress — 'deposit' was missing from this list, so the stake screen
          showed three grey dots with no active step. */}
      <View style={styles.progress}>
        {(['app', 'type', 'configure', 'deposit'] as Step[]).map((s, i) => {
          const order = ['app', 'type', 'configure', 'deposit'];
          const current = order.indexOf(step);
          const pos = order.indexOf(s);
          return (
            <View
              key={s}
              style={[
                styles.progressDot,
                step === s && styles.progressDotActive,
                pos < current && styles.progressDotDone,
              ]}
            />
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Step 1: Pick App */}
        {step === 'app' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Which app?</Text>
            <Text style={styles.stepSubtitle}>Select the app you want to restrict</Text>

            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowPicker(true)}
            >
              <View style={styles.pickerPlaceholder}>
                <Text style={styles.pickerPlaceholderIcon}>📱</Text>
                <Text style={styles.pickerPlaceholderText}>Tap to choose an app</Text>
              </View>
            </TouchableOpacity>

            {packageName ? (
              <View style={styles.selectedApp}>
                <View style={styles.selectedAppIcon}>
                  <Text style={styles.selectedAppIconText}>{appName[0]}</Text>
                </View>
                <View>
                  <Text style={styles.selectedAppName}>{appName}</Text>
                  <Text style={styles.selectedAppPkg}>{packageName}</Text>
                </View>
              </View>
            ) : null}

            {showPicker && (
              <AppPicker
                onSelect={handleAppSelected}
                onCancel={() => setShowPicker(false)}
                existingPackages={existingPackages}
              />
            )}

            {!session && (
              <View className="flex-row items-center gap-3 p-3.5 rounded-xl bg-surface-alt border border-border mt-4">
                <Ionicons name="shield-outline" size={18} color={colors.primary} />
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-foreground">Sign in to activate limits</Text>
                  <Text className="text-[11px] text-muted-foreground mt-0.5">
                    Pick an app and configure rules. You will be prompted to log in to save.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Step 2: Restriction Type */}
        {step === 'type' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Restriction</Text>
            <Text style={styles.stepSubtitle}>How should Screenly handle {appName}?</Text>
            {RULE_TYPES.map(opt => (
              <TouchableOpacity key={opt.value} onPress={() => setRuleType(opt.value)}>
                <Card style={[styles.typeCard, ruleType === opt.value && styles.typeCardSelected]}>
                  <Text style={styles.typeEmoji}>{opt.emoji}</Text>
                  <View style={styles.typeInfo}>
                    <Text style={[styles.typeLabel, ruleType === opt.value && { color: colors.textMuted }]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.typeDesc}>{opt.desc}</Text>
                  </View>
                  {ruleType === opt.value && <Text style={styles.checkmark}>✓</Text>}
                </Card>
              </TouchableOpacity>
            ))}
            <Button title="Next >" onPress={() => setStep('configure')} style={{ marginTop: spacing.xl }} />
          </View>
        )}

        {/* Step 3: Configure */}
        {step === 'configure' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Configure</Text>
            {ruleType === 'daily_limit' && (
              <>
                <Text style={styles.stepSubtitle}>
                  Block {appName} after how many minutes?
                </Text>
                <View style={styles.periodRow}>
                  <TouchableOpacity
                    style={[styles.periodBtn, period === 'daily' && styles.periodBtnActive]}
                    onPress={() => setPeriod('daily')}
                  >
                    <Text style={[styles.periodBtnText, period === 'daily' && styles.periodBtnTextActive]}>
                      Per Day
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.periodBtn, period === 'hourly' && styles.periodBtnActive]}
                    onPress={() => setPeriod('hourly')}
                  >
                    <Text style={[styles.periodBtnText, period === 'hourly' && styles.periodBtnTextActive]}>
                      Per Hour
                    </Text>
                  </TouchableOpacity>
                </View>
                <Input
                  label="Limit (minutes)"
                  value={limitMinutes}
                  onChangeText={setLimitMinutes}
                  keyboardType="number-pad"
                  placeholder="60"
                  error={errors.limitMinutes}
                />
                <Text className="mt-0 text-[12px] text-text-muted">
                  0 blocks {appName} right away. Anything higher lets it run for that long, then
                  blocks it.
                </Text>
              </>
            )}
            {ruleType === 'schedule' && (
              <>
                <Text style={styles.stepSubtitle}>
                  Allow {appName} only during these hours
                </Text>

                <Text style={styles.timeLabel}>From</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={[styles.timeInput, errors.startH && styles.timeInputError]}
                    value={startH}
                    onChangeText={t => { setStartH(t.replace(/[^0-9]/g, '')); setErrors(prev => ({ ...prev, startH: '' })); }}
                    keyboardType="number-pad"
                    placeholder="1"
                    placeholderTextColor={colors.textMuted}
                    maxLength={2}
                  />
                  <Text style={styles.timeSep}>:</Text>
                  <TextInput
                    style={[styles.timeInput, errors.startM && styles.timeInputError]}
                    value={startM}
                    onChangeText={t => { setStartM(t.replace(/[^0-9]/g, '')); setErrors(prev => ({ ...prev, startM: '' })); }}
                    keyboardType="number-pad"
                    placeholder="00"
                    placeholderTextColor={colors.textMuted}
                    maxLength={2}
                  />
                  <View style={styles.ampmGroup}>
                    <TouchableOpacity
                      style={[styles.ampmBtn, startP === 'AM' && styles.ampmBtnActive]}
                      onPress={() => setStartP('AM')}
                    >
                      <Text style={[styles.ampmText, startP === 'AM' && styles.ampmTextActive]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.ampmBtn, startP === 'PM' && styles.ampmBtnActive]}
                      onPress={() => setStartP('PM')}
                    >
                      <Text style={[styles.ampmText, startP === 'PM' && styles.ampmTextActive]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {errors.startH && <Text style={styles.timeError}>{errors.startH}</Text>}
                {errors.startM && <Text style={styles.timeError}>{errors.startM}</Text>}

                <Text style={[styles.timeLabel, { marginTop: spacing.md }]}>Until</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={[styles.timeInput, errors.endH && styles.timeInputError]}
                    value={endH}
                    onChangeText={t => { setEndH(t.replace(/[^0-9]/g, '')); setErrors(prev => ({ ...prev, endH: '' })); }}
                    keyboardType="number-pad"
                    placeholder="7"
                    placeholderTextColor={colors.textMuted}
                    maxLength={2}
                  />
                  <Text style={styles.timeSep}>:</Text>
                  <TextInput
                    style={[styles.timeInput, errors.endM && styles.timeInputError]}
                    value={endM}
                    onChangeText={t => { setEndM(t.replace(/[^0-9]/g, '')); setErrors(prev => ({ ...prev, endM: '' })); }}
                    keyboardType="number-pad"
                    placeholder="00"
                    placeholderTextColor={colors.textMuted}
                    maxLength={2}
                  />
                  <View style={styles.ampmGroup}>
                    <TouchableOpacity
                      style={[styles.ampmBtn, endP === 'AM' && styles.ampmBtnActive]}
                      onPress={() => setEndP('AM')}
                    >
                      <Text style={[styles.ampmText, endP === 'AM' && styles.ampmTextActive]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.ampmBtn, endP === 'PM' && styles.ampmBtnActive]}
                      onPress={() => setEndP('PM')}
                    >
                      <Text style={[styles.ampmText, endP === 'PM' && styles.ampmTextActive]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {errors.endH && <Text style={styles.timeError}>{errors.endH}</Text>}
                {errors.endM && <Text style={styles.timeError}>{errors.endM}</Text>}
              </>
            )}
            {ruleType === 'block_always' && (
              <Text style={styles.stepSubtitle}>
                {appName} will always be blocked.
              </Text>
            )}
            {session ? (
              <Button
                title={loading ? 'Saving…' : 'Add App'}
                onPress={submit}
                disabled={loading || hasConfigureErrors()}
                style={{ marginTop: spacing.xl }}
              />
            ) : (
              <>
                <View className="mt-6 p-3.5 rounded-xl bg-surface-alt border border-border">
                  <Text className="text-xs font-semibold text-foreground">Sign in to set limits</Text>
                  <Text className="text-[11px] text-muted-foreground mt-0.5">
                    Limits are stored in your account and enforced on this device. Without an
                    account nothing you configure here can be saved or applied.
                  </Text>
                </View>
                <Button
                  title="Sign in to continue"
                  onPress={handleLoginRedirect}
                  disabled={loading || hasConfigureErrors()}
                  style={{ marginTop: spacing.xl }}
                />
              </>
            )}
          </View>
        )}

        {/* Step 4: Deposit — ₹0 is the first tier, so the stake is a choice made here
            rather than a gate on the previous screen. */}
        {step === 'deposit' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Lock in your commitment</Text>

            {/* Amount first — it is the primary decision, and duration only matters once
            a paid amount is chosen. */}
            <Text style={styles.stakeLabel}>HOW MUCH ARE YOU STAKING?</Text>
            {stakeTiers.filter((t) => !isFreeTier(t.id)).length === 0 ? (
              <Text style={styles.warningText}>
                Staked challenges are unavailable right now — the stake products may not be
                active yet. You can still add the limit with no money involved.
              </Text>
            ) : (
              <View className="flex-row flex-wrap -mx-1">
                {stakeTiers.map(tier => {
                  const active = selectedTier?.id === tier.id;
                  return (
                    <TouchableOpacity
                      key={tier.id}
                      onPress={() => setSelectedTier(tier)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      className={`w-[48%] mx-[1%] mb-2 items-center justify-center px-3 py-3.5 rounded-xl border active:opacity-70 ${
                        active ? 'border-primary bg-primary-light border-[1.5px]' : 'border-border bg-surface'
                      }`}
                    >
                      <Text
                        className={`text-[17px] font-bold ${
                          active ? 'text-primary' : 'text-text-secondary'
                        }`}
                      >
                        {tier.displayPrice}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {!isFreeTier(selectedTier?.id ?? '') && (
              <>
                <View className="h-4" />
                <Text style={styles.stakeLabel}>HOW LONG DO YOU WANT TO STAY LOCKED?</Text>
                <View className="flex-row flex-wrap -mx-1">
                  {(Object.keys(CHALLENGE_DURATIONS) as DurationId[]).map((id, i) => {
                    const active = durationId === id;
                    // Week and month share a row; the year takes the full width
                    // below them, since "1 year" is the outlier in both length
                    // and commitment.
                    const wide = i === 2;
                    return (
                      <TouchableOpacity
                        key={id}
                        onPress={() => setDurationId(id)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        className={`${wide ? 'w-full' : 'w-[48%]'} mx-[1%] mb-2 items-center justify-center px-3 py-4 rounded-xl border active:opacity-70 ${
                          active ? 'border-primary bg-primary-light border-[1.5px]' : 'border-border bg-surface'
                        }`}
                      >
                        <Text
                          className={`text-[16px] font-bold ${
                            active ? 'text-primary' : 'text-text-secondary'
                          }`}
                        >
                          {formatDuration(id)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {selectedTier && (
                  <Text className="mt-6 text-center text-[13px] text-text-muted">
                    <Text className="font-bold text-text-secondary">
                      {selectedTier.displayPrice} locked for {formatDuration(durationId)}
                    </Text>
                    {'\n'}Hold out and you get 100% of it back.
                  </Text>
                )}
              </>
            )}

            {session ? (
              <Button
                title={
                  depositing
                    ? statusText || 'Working…'
                    : isFreeTier(selectedTier?.id ?? '')
                      ? `Add ${appName}`
                      : 'Stake & Start Challenge'
                }
                onPress={handleDeposit}
                disabled={depositing || !selectedTier}
                style={{ marginTop: spacing.xl }}
              />
            ) : (
              <Button
                title="Sign in to continue"
                onPress={handleLoginRedirect}
                disabled={depositing}
                style={{ marginTop: spacing.xl }}
              />
            )}
            <Button
              title="Discard"
              variant="secondary"
              onPress={() => router.dismissTo('/(protected)/(tabs)/limits' as any)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}

        {/* Done */}
        {step === 'done' && (
          <View style={styles.doneContainer}>
            <Text style={styles.doneEmoji}>✅</Text>
            <Text style={styles.doneTitle}>App added!</Text>
            <Text style={styles.doneSubtitle}>{appName} is now being tracked</Text>
            <Button title="Go Home" onPress={() => router.dismissTo('/(protected)/(tabs)/limits' as any)} style={{ marginTop: spacing.xl }} />
            <Button
              title="Add Another"
              variant="secondary"
              onPress={() => {
                setStep('app'); setPackageName(''); setAppName('');
                setRuleType('daily_limit'); setLimitMinutes('60'); setPeriod('daily');
              }}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: { fontFamily: fonts.semiBold, fontSize: 17, color: colors.text },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: { backgroundColor: colors.primary, width: 24 },
  progressDotDone:   { backgroundColor: colors.primary },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  stepContainer: {},
  stepTitle: { fontFamily: fonts.bold, fontSize: 22, color: colors.text, marginBottom: spacing.md },
  stepSubtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xl },
  pickerButton: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pickerPlaceholder: { alignItems: 'center' },
  pickerPlaceholderIcon: { fontSize: 32, marginBottom: spacing.sm },
  pickerPlaceholderText: { fontFamily: fonts.medium, fontSize: 15, color: colors.textSecondary },
  selectedApp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  selectedAppIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAppIconText: { fontFamily: fonts.semiBold, fontSize: 20, color: '#fff' },
  selectedAppName: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },
  selectedAppPkg: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  typeCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  typeCardSelected: { borderColor: colors.borderSoft, borderWidth: 2 },
  typeEmoji: { fontSize: 28, marginRight: spacing.md },
  typeInfo: { flex: 1 },
  typeLabel: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text },
  typeDesc:  { fontFamily: fonts.regular,  fontSize: 13, color: colors.textSecondary },
  checkmark: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary },
  doneContainer: { alignItems: 'center', paddingTop: 80 },
  doneEmoji:   { fontSize: 64, marginBottom: spacing.lg },
  doneTitle:   { fontFamily: fonts.bold,    fontSize: 24, color: colors.text },
  doneSubtitle:{ fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, marginTop: spacing.sm },
  timeLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary, marginBottom: spacing.sm },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  timeInput: {
    width: 52,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    padding: 0,
  },
  timeInputError: { borderColor: colors.danger },
  timeSep: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginHorizontal: 2 },
  ampmGroup: { flexDirection: 'row', marginLeft: spacing.sm, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  ampmBtn: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.surface },
  ampmBtnActive: { backgroundColor: colors.primary },
  ampmText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text },
  ampmTextActive: { color: '#fff' },
  timeError: { fontFamily: fonts.regular, fontSize: 12, color: colors.danger, marginTop: 4 },
  walletLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  walletAddr: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  copyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primary,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  periodBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  periodBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  periodBtnTextActive: {
    color: colors.primary,
  },
  walletHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  stakeLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },

  warningText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.danger,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
});
