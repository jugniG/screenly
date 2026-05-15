import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { colors, fonts, spacing, radius } from '../components/ui/theme';
import { apiFetch } from '../lib/fetchApi';

type RuleType = 'daily_limit' | 'schedule' | 'block_always';
type Step = 'app' | 'type' | 'configure' | 'done';

interface RuleTypeOption {
  value: RuleType;
  label: string;
  desc: string;
  emoji: string;
}

const RULE_TYPES: RuleTypeOption[] = [
  { value: 'daily_limit',  label: 'Daily Limit',   desc: 'Block after N minutes per day',       emoji: '⏱️' },
  { value: 'schedule',     label: 'Time Schedule',  desc: 'Block between specific hours',         emoji: '🗓️' },
  { value: 'block_always', label: 'Always Block',   desc: 'Permanently block the app',            emoji: '🚫' },
];

export default function AddRuleScreen() {
  const [step, setStep]             = useState<Step>('app');
  const [packageName, setPackageName] = useState('');
  const [appName, setAppName]       = useState('');
  const [ruleType, setRuleType]     = useState<RuleType>('daily_limit');
  const [limitMinutes, setLimitMinutes] = useState('60');
  const [scheduleStart, setScheduleStart] = useState('22:00');
  const [scheduleEnd, setScheduleEnd]   = useState('07:00');
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  function validateApp() {
    const e: Record<string, string> = {};
    if (!packageName.trim()) e.packageName = 'Required (e.g. com.instagram.android)';
    if (!appName.trim())     e.appName = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateConfigure() {
    const e: Record<string, string> = {};
    if (ruleType === 'daily_limit') {
      const m = parseInt(limitMinutes);
      if (isNaN(m) || m < 1) e.limitMinutes = 'Enter a valid number of minutes';
    }
    if (ruleType === 'schedule') {
      if (!/^\d{2}:\d{2}$/.test(scheduleStart)) e.scheduleStart = 'Format: HH:MM';
      if (!/^\d{2}:\d{2}$/.test(scheduleEnd))   e.scheduleEnd   = 'Format: HH:MM';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
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
      if (ruleType === 'daily_limit') body.limitMinutes = parseInt(limitMinutes);
      if (ruleType === 'schedule') { body.scheduleStart = scheduleStart; body.scheduleEnd = scheduleEnd; }

      const res = await apiFetch('/api/rules', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.error ?? 'Failed to create rule');
        return;
      }

      setStep('done');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 'app' ? router.back() : setStep(step === 'type' ? 'app' : step === 'configure' ? 'type' : 'app'))}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Rule</Text>
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

        {/* Step 1: App */}
        {step === 'app' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Which app?</Text>
            <Text style={styles.stepSubtitle}>Enter the app's package name and display name</Text>
            <Input
              label="Package Name"
              value={packageName}
              onChangeText={setPackageName}
              placeholder="e.g. com.instagram.android"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.packageName}
              containerStyle={{ marginBottom: spacing.md }}
            />
            <Input
              label="App Name"
              value={appName}
              onChangeText={setAppName}
              placeholder="e.g. Instagram"
              error={errors.appName}
            />
            <Text style={styles.hint}>
              💡 On Android, find the package name in Settings → Apps → tap app → App Info
            </Text>
            <Button
              title="Next →"
              onPress={() => { if (validateApp()) setStep('type'); }}
              style={{ marginTop: spacing.xl }}
            />
          </View>
        )}

        {/* Step 2: Rule Type */}
        {step === 'type' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Rule type</Text>
            <Text style={styles.stepSubtitle}>How should Screenly handle {appName}?</Text>
            {RULE_TYPES.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setRuleType(opt.value)}
              >
                <Card style={[styles.typeCard, ruleType === opt.value ? styles.typeCardSelected : undefined]}>
                  <Text style={styles.typeEmoji}>{opt.emoji}</Text>
                  <View style={styles.typeInfo}>
                    <Text style={[styles.typeLabel, ruleType === opt.value ? { color: colors.primary } : undefined]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.typeDesc}>{opt.desc}</Text>
                  </View>
                  {ruleType === opt.value && <Text style={styles.checkmark}>✓</Text>}
                </Card>
              </TouchableOpacity>
            ))}
            <Button
              title="Next →"
              onPress={() => setStep('configure')}
              style={{ marginTop: spacing.xl }}
            />
          </View>
        )}

        {/* Step 3: Configure */}
        {step === 'configure' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Configure</Text>
            {ruleType === 'daily_limit' && (
              <>
                <Text style={styles.stepSubtitle}>
                  Block {appName} after how many minutes per day?
                </Text>
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
                  Block {appName} during these hours
                </Text>
                <Input
                  label="Block from (HH:MM)"
                  value={scheduleStart}
                  onChangeText={setScheduleStart}
                  placeholder="22:00"
                  error={errors.scheduleStart}
                  containerStyle={{ marginBottom: spacing.md }}
                />
                <Input
                  label="Until (HH:MM)"
                  value={scheduleEnd}
                  onChangeText={setScheduleEnd}
                  placeholder="07:00"
                  error={errors.scheduleEnd}
                />
              </>
            )}
            {ruleType === 'block_always' && (
              <Text style={styles.stepSubtitle}>
                {appName} will always be blocked. You can still unlock with a countdown or payment.
              </Text>
            )}
            <Button
              title={loading ? 'Saving…' : 'Save Rule'}
              onPress={submit}
              disabled={loading}
              style={{ marginTop: spacing.xl }}
            />
          </View>
        )}

        {/* Done */}
        {step === 'done' && (
          <View style={styles.doneContainer}>
            <Text style={styles.doneEmoji}>✅</Text>
            <Text style={styles.doneTitle}>Rule created!</Text>
            <Text style={styles.doneSubtitle}>{appName} is now protected</Text>
            <Button title="Back to Apps" onPress={() => router.replace('/(tabs)/apps')} style={{ marginTop: spacing.xl }} />
            <Button
              title="Add Another"
              variant="secondary"
              onPress={() => {
                setStep('app'); setPackageName(''); setAppName('');
                setRuleType('daily_limit'); setLimitMinutes('60');
              }}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  back: { fontFamily: fonts.medium, fontSize: 15, color: colors.primary },
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
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  typeCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  typeCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  typeEmoji: { fontSize: 28, marginRight: spacing.md },
  typeInfo: { flex: 1 },
  typeLabel: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text },
  typeDesc:  { fontFamily: fonts.regular,  fontSize: 13, color: colors.textSecondary },
  checkmark: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary },
  doneContainer: { alignItems: 'center', paddingTop: 80 },
  doneEmoji:   { fontSize: 64, marginBottom: spacing.lg },
  doneTitle:   { fontFamily: fonts.bold,    fontSize: 24, color: colors.text },
  doneSubtitle:{ fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, marginTop: spacing.sm },
});
