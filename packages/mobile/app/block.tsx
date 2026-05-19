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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { colors, fonts, spacing } from '../components/ui/theme';
import { apiFetch, API_BASE } from '../lib/fetchApi';
import { unlockApp } from '../lib/enforcer';
import ScreenlyEnforcer from '../modules/screenly-enforcer/src/ScreenlyEnforcerModule';

export default function BlockScreen() {
  const { packageName, appName } = useLocalSearchParams<{ packageName: string; appName: string }>();

  const dismissed = useRef(false);
  const [loading, setLoading] = useState(false);

  function goHome() {
    if (dismissed.current) return;
    dismissed.current = true;
    router.replace('/(tabs)');
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
        if (fg && fg !== packageName) {
          goHome();
        }
      } catch {}
    });
    return () => sub.remove();
  }, [packageName]);

  async function handlePayUnlock() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/unlock/checkout', {
        method: 'POST',
        body: JSON.stringify({ packageName, appName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.error ?? 'Could not start checkout');
        return;
      }

      const { checkout_url } = await res.json();

      const result = await WebBrowser.openAuthSessionAsync(checkout_url, 'screenly://unlock-confirm');

      if (result.type === 'success') {
        const url = result.url;
        const params = new URL(url).searchParams;
        const status = params.get('status');
        const pid    = params.get('payment_id');

        if ((status === 'succeeded' || status === 'paid') && pid) {
          const confirmRes = await apiFetch('/api/unlock/confirm', {
            method: 'POST',
            body: JSON.stringify({ paymentId: pid, packageName }),
          });

          if (confirmRes.ok) {
            await unlockApp(packageName!);
            Alert.alert('Unlocked for today!', `${appName} is available until midnight`);
            router.replace('/(tabs)');
            return;
          }
        }
        Alert.alert('Payment not confirmed', 'Please try again');
      } else {
        Alert.alert('Cancelled', 'Payment was not completed');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.iconWrap}>
        <View style={styles.appIcon}>
          <Text style={styles.appIconText}>{(appName ?? 'A')[0]}</Text>
        </View>
        <Text style={styles.appName}>{appName}</Text>
        <Text style={styles.blockedLabel}>This app is blocked</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Opening checkout…</Text>
      ) : (
        <>
          <TouchableOpacity onPress={handlePayUnlock} style={styles.unlockBtn}>
            <Text style={styles.unlockText}>Unlock now</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goHome} style={styles.backBtn}>
            <Text style={styles.backText}>Back to home</Text>
          </TouchableOpacity>
        </>
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
  appIconText: { fontFamily: fonts.bold, fontSize: 36, color: colors.primary },
  appName: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  blockedLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.danger,
    marginTop: 4,
  },
  unlockBtn: {
    paddingVertical: spacing.sm,
  },
  unlockText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  backBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  backText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
