import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AppState,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ScreenlyEnforcer from '../modules/screenly-enforcer/src/ScreenlyEnforcerModule';
import { colors, fonts, spacing } from '../components/ui/theme';

type Step = 'usage_stats' | 'accessibility';

interface StepConfig {
  key: Step;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  instructions: string[];
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
    check: () => ScreenlyEnforcer.hasUsageStatsPermission(),
    request: () => ScreenlyEnforcer.requestUsageStatsPermission(),
  },
  {
    key: 'accessibility',
    icon: 'accessibility',
    title: 'Accessibility Service',
    desc: 'Screenly uses this to detect when a blocked app opens and show you the block screen immediately.',
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
  const [stepIndex, setStepIndex] = useState(0);
  const [granted, setGranted] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  async function checkCurrentStep() {
    setChecking(true);
    const ok = await step.check();
    setGranted(ok);
    setChecking(false);

    if (ok) {
      if (isLast) {
        await AsyncStorage.setItem('setup_done', '1');
        router.replace('/(tabs)');
      } else {
        setStepIndex(i => i + 1);
        setGranted(null);
      }
    }
  }

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkCurrentStep();
      }
    });
    return () => sub.remove();
  }, [stepIndex]);

  useEffect(() => {
    checkCurrentStep();
  }, [stepIndex]);

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
          Step {stepIndex + 1} of {STEPS.length}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Ionicons name={step.icon} size={40} color={colors.primary} />
        </View>

        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.desc}>{step.desc}</Text>

        {!granted && !checking && (
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
          onPress={checkCurrentStep}
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
    backgroundColor: '#0D0D1A',
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl + 20,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 28,
    borderRadius: 5,
  },
  dotDone: {
    backgroundColor: '#22C55E',
  },
  stepCount: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  body: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(92,110,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: spacing.xl,
  },
  instructions: {
    width: '100%',
    marginBottom: spacing.xl,
    gap: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(92,110,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
  instructionText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    flex: 1,
    lineHeight: 20,
  },
  checkingText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 24,
  },
  grantedText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#22C55E',
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 12,
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
    color: 'rgba(255,255,255,0.35)',
  },
});
