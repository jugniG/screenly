import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AppState,
  TouchableOpacity,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ScreenlyEnforcer from '@/modules/screenly-enforcer/src/ScreenlyEnforcerModule';
import { authClient } from '@/lib/auth';
import { colors, fonts, spacing } from '@/components/ui/theme';

type Step = 'usage_stats' | 'accessibility';

interface StepConfig {
  key: Step;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  instructions: string[];
  tip?: string;
  check: () => Promise<boolean>;
  request: () => Promise<void>;
}

const STEPS: StepConfig[] = [
  {
    key: 'usage_stats',
    icon: 'analytics',
    title: 'Usage Access',
    desc: "Screenly needs to see how long you use each app. This is how we know when you've hit your limit.",
    instructions: [
      'Tap "Open Settings" below',
      'Find and tap "Screenly" in the list',
      'Toggle the switch to ON',
    ],
    tip: 'Tip: tap the search bar in the list and type "s" — Screenly shows up right away.',
    check: () => ScreenlyEnforcer.hasUsageStatsPermission(),
    request: () => ScreenlyEnforcer.requestUsageStatsPermission(),
  },
  {
    key: 'accessibility',
    icon: 'accessibility',
    title: 'One more permission',
    desc: 'This is a NEW and different permission. Screenly uses it to detect when a blocked app opens and show you the block screen immediately.',
    instructions: [
      'Tap "Open Settings" below',
      'Tap "Installed apps" (or "Downloaded apps")',
      'Find and tap "Screenly"',
      'Toggle "Screenly" to ON',
    ],
    check: () => ScreenlyEnforcer.isAccessibilityServiceEnabled(),
    request: () => ScreenlyEnforcer.requestAccessibilityService(),
  },
];

export default function SetupScreen() {
  const { data: session, isPending, isFetching } = authClient.useSession() as any;
  const [stepIndex, setStepIndex] = useState(0);
  const [granted, setGranted] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const step = STEPS[stepIndex] ?? STEPS[0];

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const currentStep = STEPS[stepIndex];
      if (!currentStep || isPending || isFetching || !session) return;
      setChecking(true);
      try {
        const ok = await currentStep.check();
        if (cancelled) return;
        setGranted(ok);
        setChecking(false);
        if (ok) {
          if (stepIndex === STEPS.length - 1) {
            await AsyncStorage.setItem('setup_done', '1');
            router.replace('/(protected)/(tabs)' as any);
          } else {
            await new Promise(r => setTimeout(r, 900));
            if (cancelled) return;
            setStepIndex(i => i + 1);
            setGranted(null);
          }
        }
      } catch {
        if (!cancelled) {
          setGranted(false);
          setChecking(false);
        }
      }
    }
    run();
    return () => { cancelled = true; };
  }, [stepIndex, retryCount, session, isPending, isFetching]);

  useEffect(() => {
    if (isPending || isFetching || !session) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setRetryCount(c => c + 1);
      }
    });
    return () => sub.remove();
  }, [session, isPending, isFetching]);

  if (isPending || isFetching) {
    return <View style={styles.screen} />;
  }

  if (!session) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.stepDots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === stepIndex && styles.dotActive,
                i < stepIndex && styles.dotDone,
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepCount}>
          {stepIndex === STEPS.length - 1 ? 'Last step' : `Step ${stepIndex + 1} of ${STEPS.length}`}
        </Text>
      </View>

      {stepIndex > 0 && (
        <View style={styles.prevGrantedBanner}>
          <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
          <View style={styles.prevGrantedTextWrap}>
            <Text style={styles.prevGrantedTitle}>
              {STEPS[stepIndex - 1].title} — Done!
            </Text>
            <Text>
              That one worked. Now just this last permission.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Ionicons name={step.icon} size={20} color={colors.primary} />
        </View>

        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.desc}>{step.desc}</Text>

        <View style={styles.instructions}>
          {step.instructions.map((line, i) => (
            <View key={i} style={styles.instructionRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{line}</Text>
            </View>
          ))}
        </View>

        {step.tip && (
          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={18} color={colors.primary} />
            <Text style={styles.tipText}>{step.tip}</Text>
          </View>
        )}

        {checking ? (
          <Text style={styles.checkingText}>Checking…</Text>
        ) : granted ? (
          <View style={styles.grantedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={styles.grantedText}>Granted</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={step.request}
            activeOpacity={0.75}
          >
            <Ionicons name="settings-outline" size={18} color="#fff" />
            <Text style={styles.settingsBtnText}>Open Settings</Text>
          </TouchableOpacity>
        )}
      </View>

      {!checking && !granted && (
        <TouchableOpacity
          style={styles.checkAgain}
          onPress={() => setRetryCount(c => c + 1)}
        >
          <Text style={styles.checkAgainText}>Check again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: 40,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  prevGrantedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  prevGrantedTextWrap: { flex: 1 },
  prevGrantedTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#22C55E',
  },
  prevGrantedSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 28,
    borderRadius: 5,
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  stepCount: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  body: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: spacing.xl,
  },
  instructions: {
    width: '100%',
    marginBottom: spacing.xl,
    gap: 12,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    fontSize: 8,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.primary,
  },
  instructionText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.text,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(249, 87, 33, 0.25)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  tipText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
  },
  checkingText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.successSoft,
    borderRadius: 24,
  },
  grantedText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.success,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#fff',
  },
  checkAgain: {
    marginTop: spacing.xl + 10,
  },
  checkAgainText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
