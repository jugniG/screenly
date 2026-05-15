import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { authClient } from '../../lib/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, fonts, spacing } from '../../components/ui/theme';
import { apiFetch } from '../../lib/fetchApi';

interface UnlockEvent {
  id: string;
  packageName: string;
  appName: string;
  unlockType: 'free' | 'paid';
  minutesUnlocked: number;
  createdAt: string;
  amountPaid: number | null;
}

export default function AccountScreen() {
  const { data: session } = authClient.useSession();
  const [history, setHistory] = useState<UnlockEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/unlock/history')
      .then(r => r.ok ? r.json() : [])
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authClient.signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  }

  const totalPaid = history
    .filter(e => e.unlockType === 'paid')
    .reduce((s, e) => s + (e.amountPaid ?? 0), 0);
  const freeCount = history.filter(e => e.unlockType === 'free').length;
  const paidCount = history.filter(e => e.unlockType === 'paid').length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Account</Text>

      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(session?.user?.name ?? 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.profileName}>{session?.user?.name ?? '—'}</Text>
          <Text style={styles.profileEmail}>{session?.user?.email ?? '—'}</Text>
        </View>
      </Card>

      {/* Stats */}
      <View style={styles.row}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{freeCount}</Text>
          <Text style={styles.statLabel}>Free Unlocks</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{paidCount}</Text>
          <Text style={styles.statLabel}>Paid Unlocks</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            ${(totalPaid / 100).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </Card>
      </View>

      {/* Unlock History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unlock History</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : history.length === 0 ? (
          <Text style={styles.emptyText}>No unlocks yet</Text>
        ) : (
          history.slice(0, 20).map(event => (
            <Card key={event.id} style={styles.historyRow} padding="sm">
              <View style={styles.historyTop}>
                <View style={styles.appIconPlaceholder}>
                  <Text style={styles.appIconText}>{event.appName[0]}</Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyApp}>{event.appName}</Text>
                  <Text style={styles.historyTime}>
                    {new Date(event.createdAt).toLocaleDateString()} · {event.minutesUnlocked}m
                  </Text>
                </View>
                <View style={[
                  styles.badge,
                  { backgroundColor: event.unlockType === 'free' ? colors.primaryLight : '#FEF3C7' },
                ]}>
                  <Text style={[
                    styles.badgeText,
                    { color: event.unlockType === 'free' ? colors.primary : '#D97706' },
                  ]}>
                    {event.unlockType === 'free' ? 'Free' : `$${((event.amountPaid ?? 0) / 100).toFixed(2)}`}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Sign Out */}
      <Button
        title="Sign Out"
        variant="danger"
        onPress={handleSignOut}
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.text, marginBottom: spacing.lg, marginTop: spacing.md },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 22, color: '#fff' },
  profileName: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },
  profileEmail: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  statLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
  historyRow: { marginBottom: spacing.sm },
  historyTop: { flexDirection: 'row', alignItems: 'center' },
  appIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  appIconText: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  historyInfo: { flex: 1 },
  historyApp: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  historyTime: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontFamily: fonts.semiBold, fontSize: 12 },
});
