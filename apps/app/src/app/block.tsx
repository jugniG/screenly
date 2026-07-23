import '../lib/polyfill';
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
import { colors, fonts, spacing } from '../components/ui/theme';
import { syncRules } from '../lib/enforcer';
import { orpc } from '../lib/orpc';
import ScreenlyEnforcer from '../modules/screenly-enforcer/src/ScreenlyEnforcerModule';

export default function BlockScreen() {

  const { packageName, appName, ruleId } = useLocalSearchParams<{ packageName: string; appName: string; ruleId: string }>();

  const ownPackage = Constants.expoConfig?.android?.package;
  const dismissed = useRef(false);
  const [loading, setLoading] = useState(false);
  const [iconUri, setIconUri] = useState<string | null>(null);

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
        if (fg && fg !== packageName && fg !== ownPackage) {
          goHome();
        }
      } catch { }
    });
    return () => sub.remove();
  }, [packageName]);

  async function handleGiveIn() {
    if (!packageName) return;
    Alert.alert(
      'Give in?',
      `You'll forfeit your commitment to ${appName}. Are you sure?`,
      [
        { text: 'Stay strong', style: 'cancel' },
        {
          text: 'I give in',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await orpc('deleteRule', { id: ruleId });
              await syncRules();
              Alert.alert('Give in', `${appName} has been removed.`);
              router.replace('/(tabs)');
            } catch (e: any) {
              console.error('[BlockScreen - GiveIn Failed]', e);
              Alert.alert('Unlock failed', 'Failed to remove restriction. Please try again.');
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
      <View style={styles.btnRow}>
        <TouchableOpacity onPress={goHome} style={styles.backBtn}>
          <Text style={styles.backText}>Back to home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGiveIn} style={styles.giveInBtn}>
          <Text style={styles.giveInText}>I give in</Text>
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
