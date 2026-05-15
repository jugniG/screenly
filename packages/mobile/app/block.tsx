import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { colors, fonts, spacing } from '../components/ui/theme';
import { Button } from '../components/ui/Button';
import { apiFetch } from '../lib/fetchApi';

const FREE_UNLOCK_SECONDS = 5 * 60; // 5 minutes countdown

export default function BlockScreen() {
  const { packageName, appName } = useLocalSearchParams<{ packageName: string; appName: string }>();

  const [mode, setMode]           = useState<'choice' | 'countdown' | 'unlocked' | 'paying'>('choice');
  const [secondsLeft, setSeconds] = useState(FREE_UNLOCK_SECONDS);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Prevent Android back button from bypassing block
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (mode !== 'countdown') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setMode('unlocked');
          handleFreeUnlock();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [mode]);

  async function handleFreeUnlock() {
    try {
      await apiFetch('/api/unlock/free', {
        method: 'POST',
        body: JSON.stringify({ packageName, minutesUnlocked: 30 }),
      });
    } catch {}
  }

  async function handlePayUnlock() {
    setUnlockLoading(true);
    setMode('paying');
    try {
      const res = await apiFetch('/api/unlock/checkout', {
        method: 'POST',
        body: JSON.stringify({ packageName, appName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.error ?? 'Could not start checkout');
        setMode('choice');
        return;
      }

      const { checkout_url, payment_id } = await res.json();

      // Open Dodo Payments checkout in browser
      const result = await WebBrowser.openAuthSessionAsync(
        checkout_url,
        `screenly://unlock-confirm?payment_id=${payment_id}`
      );

      if (result.type === 'success') {
        // Confirm payment
        const url = result.url;
        const params = new URL(url).searchParams;
        const status = params.get('status');
        const pid    = params.get('payment_id') ?? payment_id;

        if (status === 'succeeded' || status === 'paid') {
          const confirmRes = await apiFetch('/api/unlock/confirm', {
            method: 'POST',
            body: JSON.stringify({ paymentId: pid, packageName }),
          });

          if (confirmRes.ok) {
            setMode('unlocked');
            return;
          }
        }
        Alert.alert('Payment not confirmed', 'Please try again or use the free option');
      } else {
        Alert.alert('Cancelled', 'Payment was not completed');
      }

      setMode('choice');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
      setMode('choice');
    } finally {
      setUnlockLoading(false);
    }
  }

  function formatCountdown(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  const progress = (FREE_UNLOCK_SECONDS - secondsLeft) / FREE_UNLOCK_SECONDS;

  return (
    <View style={styles.screen}>
      {/* App Icon */}
      <View style={styles.iconWrap}>
        <View style={styles.appIcon}>
          <Text style={styles.appIconText}>{(appName ?? 'A')[0]}</Text>
        </View>
        <Text style={styles.appName}>{appName}</Text>
        <Text style={styles.blockedLabel}>This app is blocked</Text>
      </View>

      {/* Content by mode */}
      {mode === 'choice' && (
        <View style={styles.choiceContainer}>
          <Text style={styles.choiceTitle}>How do you want to unlock?</Text>

          {/* Free option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => { setSeconds(FREE_UNLOCK_SECONDS); setMode('countdown'); }}
          >
            <View style={styles.optionLeft}>
              <Text style={styles.optionEmoji}>⏳</Text>
              <View>
                <Text style={styles.optionTitle}>Wait 5 minutes</Text>
                <Text style={styles.optionDesc}>Free — count down before unlocking</Text>
              </View>
            </View>
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>

          {/* Paid option */}
          <TouchableOpacity style={[styles.optionCard, styles.optionCardPay]} onPress={handlePayUnlock}>
            <View style={styles.optionLeft}>
              <Text style={styles.optionEmoji}>💳</Text>
              <View>
                <Text style={[styles.optionTitle, { color: '#fff' }]}>Unlock now</Text>
                <Text style={[styles.optionDesc, { color: 'rgba(255,255,255,0.8)' }]}>$5 — skip the wait</Text>
              </View>
            </View>
            <Text style={[styles.optionArrow, { color: '#fff' }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Go back</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'countdown' && (
        <View style={styles.countdownContainer}>
          {/* Ring */}
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Text style={styles.countdownTime}>{formatCountdown(secondsLeft)}</Text>
              <Text style={styles.countdownLabel}>remaining</Text>
            </View>
          </View>

          <Text style={styles.countdownMsg}>
            Keep this screen open. You'll be able to use {appName} in a moment.
          </Text>

          {/* Pay to skip */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => {
              if (intervalRef.current) clearInterval(intervalRef.current);
              setMode('choice');
              handlePayUnlock();
            }}
          >
            <Text style={styles.skipText}>Pay $5 to skip wait</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => { setMode('choice'); }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'paying' && (
        <View style={styles.payingContainer}>
          <Text style={styles.payingEmoji}>🔐</Text>
          <Text style={styles.payingTitle}>Opening checkout…</Text>
          <Text style={styles.payingDesc}>Complete payment in the browser</Text>
        </View>
      )}

      {mode === 'unlocked' && (
        <View style={styles.unlockedContainer}>
          <Text style={styles.unlockedEmoji}>🔓</Text>
          <Text style={styles.unlockedTitle}>Unlocked!</Text>
          <Text style={styles.unlockedDesc}>{appName} is available for 30 minutes</Text>
          <Button
            title="Open App"
            onPress={() => router.back()}
            style={{ marginTop: spacing.xl, minWidth: 200 }}
          />
        </View>
      )}
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
    marginTop: 80,
    marginBottom: spacing.xxl,
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
  appIconText: { fontFamily: fonts.bold, fontSize: 36, color: colors.primary },
  appName: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  blockedLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.danger,
    marginTop: 4,
  },

  // Choice
  choiceContainer: { width: '100%', paddingHorizontal: spacing.xl },
  choiceTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  optionCardPay: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionEmoji: { fontSize: 28 },
  optionTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },
  optionDesc:  { fontFamily: fonts.regular,  fontSize: 13, color: colors.textSecondary },
  optionArrow: { fontFamily: fonts.bold, fontSize: 18, color: colors.textMuted },

  // Countdown
  countdownContainer: { alignItems: 'center', width: '100%', paddingHorizontal: spacing.xl },
  ringOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  ringInner: { alignItems: 'center' },
  countdownTime: { fontFamily: fonts.bold, fontSize: 42, color: colors.primary },
  countdownLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  countdownMsg: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing.xl,
  },
  skipBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  skipText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.primary },

  // Paying
  payingContainer: { alignItems: 'center' },
  payingEmoji:  { fontSize: 60, marginBottom: spacing.lg },
  payingTitle:  { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  payingDesc:   { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm },

  // Unlocked
  unlockedContainer: { alignItems: 'center' },
  unlockedEmoji: { fontSize: 64, marginBottom: spacing.lg },
  unlockedTitle: { fontFamily: fonts.bold, fontSize: 28, color: colors.text },
  unlockedDesc:  { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, marginTop: spacing.sm },

  // Cancel
  cancelBtn: { marginTop: spacing.lg },
  cancelText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
});
