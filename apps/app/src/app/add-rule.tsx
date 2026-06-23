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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import AppPicker from '../components/ui/AppPicker';
import { colors, fonts, spacing, radius } from '../components/ui/theme';
import { orpc } from '../lib/orpc';
import { BackButton } from '../components/ui/BackButton';
import { syncRules } from '../lib/enforcer';
import 'react-native-get-random-values';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
  getConnection,
  loadOrCreateWallet,
  walletAddress,
  buildDepositTx,
  sendAndConfirmTx,
  USDC_MINT,
  MIN_DEPOSIT_AMOUNT,
  USDC_DECIMALS,
} from '../lib/solana';

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
  const [walletAddr, setWalletAddr] = useState('');
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [period, setPeriod]         = useState<'daily' | 'hourly'>('daily');
  const [depositDollars, setDepositDollars] = useState('10');
  const [depositing, setDepositing] = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [existingPackages, setExistingPackages] = useState<string[]>([]);

  useEffect(() => {
    orpc<Record<string, never>, { packageName: string }[]>('listRules')
      .then(rules => setExistingPackages(rules.map(r => r.packageName)))
      .catch(() => {});
  }, []);

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
      if (isNaN(m) || m < 1) e.limitMinutes = 'Enter a valid number of minutes';
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
      return isNaN(m) || m < 1;
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

  async function submit() {
    if (!validateConfigure()) return;
    setLoading(true);
    try {
      const body: any = {
        packageName,
        appName,
        ruleType,
        enabled: true,
      };
      if (ruleType === 'daily_limit') {
        body.limitMinutes = parseInt(limitMinutes);
        body.period = period;
      }
      if (ruleType === 'schedule') {
        body.scheduleStart = to24h(startH, startM, startP);
        body.scheduleEnd = to24h(endH, endM, endP);
      }

      await orpc('createRule', body);
      syncRules();

      // Load wallet for deposit step
      const wallet = await loadOrCreateWallet();
      setWalletAddr(walletAddress(wallet));
      setStep('deposit');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    setDepositing(true);
    try {
      const dollars = parseFloat(depositDollars);
      if (isNaN(dollars) || dollars < (MIN_DEPOSIT_AMOUNT / 10 ** USDC_DECIMALS)) {
        Alert.alert('Invalid amount', `Minimum deposit is $${MIN_DEPOSIT_AMOUNT / 10 ** USDC_DECIMALS}`);
        setDepositing(false);
        return;
      }
      const amount = Math.floor(dollars * 10 ** USDC_DECIMALS);
      const wallet = await loadOrCreateWallet();
      const connection = getConnection();
      const userAta = getAssociatedTokenAddressSync(USDC_MINT, wallet.publicKey);
      const tx = buildDepositTx(wallet.publicKey, userAta, packageName, amount);
      await sendAndConfirmTx(connection, tx, wallet);
      setStep('done');
    } catch (e: any) {
      Alert.alert('Deposit failed', e?.message ?? 'Could not complete deposit');
    } finally {
      setDepositing(false);
    }
  }

  function goBack() {
    if (step === 'app') router.back();
    else if (step === 'type') setStep('app');
    else if (step === 'configure') setStep('type');
  }

  return (
    <SafeAreaView style={styles.flex}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <BackButton onPress={goBack} />
        <Text style={styles.headerTitle}>Add App</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        {(['app', 'type', 'configure'] as Step[]).map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              step === s && styles.progressDotActive,
              (step === 'configure' || step === 'done') && i <= 2 && styles.progressDotDone,
              step === 'type' && i <= 1 && styles.progressDotDone,
            ]}
          />
        ))}
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
                    placeholder="10"
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
            <Button
              title={loading ? 'Saving…' : 'Save'}
              onPress={submit}
              disabled={loading || hasConfigureErrors()}
              style={{ marginTop: spacing.xl }}
            />
          </View>
        )}

        {/* Step 4: Deposit */}
        {step === 'deposit' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Lock in your commitment</Text>
            <Text style={styles.stepSubtitle}>
              Deposit USDC to commit to staying focused. If you give in, you lose it.
            </Text>

            <View style={styles.depositCard}>
              <Text style={styles.depositAmount}>${depositDollars || '0'} USDC</Text>
              <Text style={styles.depositLabel}>per app</Text>
            </View>

            <Input
              label={`Amount (min $${MIN_DEPOSIT_AMOUNT / 10 ** USDC_DECIMALS} USDC)`}
              value={depositDollars}
              onChangeText={setDepositDollars}
              keyboardType="number-pad"
              placeholder="10"
            />

            <Text style={styles.walletLabel}>Your wallet</Text>
            <Text style={styles.walletAddr} selectable>{walletAddr || 'Loading…'}</Text>
            <Text style={styles.walletHint}>
              Fund this address with USDC on Solana devnet if you haven't already.
            </Text>

            <Button
              title={depositing ? 'Depositing…' : 'Commit'}
              onPress={handleDeposit}
              disabled={depositing || !walletAddr}
              style={{ marginTop: spacing.xl }}
            />
            <Button
              title="Skip deposit for now"
              variant="secondary"
              onPress={() => setStep('done')}
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
            <Button title="Go Home" onPress={() => router.replace('/(tabs)')} style={{ marginTop: spacing.xl }} />
            <Button
              title="Add Another"
              variant="secondary"
              onPress={() => {
                setStep('app'); setPackageName(''); setAppName('');
                setRuleType('daily_limit'); setLimitMinutes('60'); setPeriod('daily'); setDepositDollars('10');
              }}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
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
    marginBottom: spacing.md,
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
  stepTitle: { fontFamily: fonts.bold, fontSize: 22, color: colors.text, marginBottom: 6 },
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
  depositCard: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  depositAmount: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.primary,
  },
  depositLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  walletLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  walletAddr: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
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
});
