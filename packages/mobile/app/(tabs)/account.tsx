import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { authClient } from '../../lib/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, fonts, spacing, radius } from '../../components/ui/theme';
import { apiFetch } from '../../lib/fetchApi';
import { syncRules } from '../../lib/enforcer';

interface UnlockEvent {
  id: string;
  packageName: string;
  appName: string;
  unlockType: 'free' | 'paid';
  minutesUnlocked: number;
  createdAt: string;
}

interface Rule {
  id: string;
  packageName: string;
  appName: string;
  ruleType: string;
  enabled: boolean;
}

export default function AccountScreen() {
  const { data: session } = authClient.useSession();
  const [history, setHistory] = useState<UnlockEvent[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [showApps, setShowApps] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(session?.user?.name ?? '');
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    apiFetch('/api/unlock/history')
      .then(r => r.ok ? r.json() : [])
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []));

  useFocusEffect(useCallback(() => {
    apiFetch('/api/rules')
      .then(r => r.ok ? r.json() : [])
      .then(setRules)
      .catch(() => {})
      .finally(() => setRulesLoading(false));
  }, []));

  async function handleSaveName() {
    if (!nameInput.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    setSaving(true);
    try {
      const res = await (authClient as any).updateUser({ name: nameInput.trim() });
      if (res?.error) {
        Alert.alert('Error', res.error.message ?? 'Could not update name');
      } else {
        setEditing(false);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveApp(rule: Rule) {
    Alert.alert(
      `Remove ${rule.appName}?`,
      `This is a commitment breaking charge of $5. You're paying to permanently remove this restriction. You can re-add the app anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay $5 & Remove',
          style: 'destructive',
          onPress: () => startRemoveCheckout(rule),
        },
      ],
    );
  }

  async function startRemoveCheckout(rule: Rule) {
    setRemoving(rule.packageName);
    try {
      const res = await apiFetch('/api/remove/checkout', {
        method: 'POST',
        body: JSON.stringify({ packageName: rule.packageName, appName: rule.appName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.error ?? 'Could not start checkout');
        return;
      }

      const { checkout_url, payment_id } = await res.json();

      const result = await WebBrowser.openAuthSessionAsync(
        checkout_url,
        `screenly://remove-confirm`,
      );

      if (result.type === 'success') {
        const params = new URL(result.url).searchParams;
        const status = params.get('status');
        const pid = params.get('payment_id') ?? payment_id;

        if (status === 'succeeded' || status === 'paid') {
          const confirmRes = await apiFetch('/api/remove/confirm', {
            method: 'POST',
            body: JSON.stringify({ paymentId: pid, packageName: rule.packageName }),
          });

          if (confirmRes.ok) {
            setRules(prev => prev.filter(r => r.id !== rule.id));
            syncRules();
            Alert.alert('Removed', `${rule.appName} restriction has been removed.`);
            return;
          }

          Alert.alert('Error', 'Could not confirm removal');
        } else {
          Alert.alert('Cancelled', 'Payment was not completed');
        }
      } else {
        Alert.alert('Cancelled', 'Payment was not completed');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setRemoving(null);
    }
  }

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

  const enabledRules = rules.filter(r => r.enabled);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(session?.user?.name ?? 'U')[0].toUpperCase()}
            </Text>
          </View>

          <TouchableOpacity onPress={() => { setEditing(true); setNameInput(session?.user?.name ?? ''); }} style={styles.nameRow}>
            <Text style={styles.profileName}>{session?.user?.name ?? '—'}</Text>
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>

          <Text style={styles.profileEmail}>{session?.user?.email ?? '—'}</Text>
        </View>

        {/* Remove App Restriction */}
        <Button
          title={`Remove App Restriction (${enabledRules.length})`}
          variant="outline"
          onPress={() => setShowApps(!showApps)}
          style={[styles.removeBtn, { marginBottom: spacing.md }]}
        />

        {showApps && (
          <View style={styles.removeSection}>
            {rulesLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : enabledRules.length === 0 ? (
              <Text style={styles.emptyText}>No apps restricted yet</Text>
            ) : (
              enabledRules.map(rule => (
                <TouchableOpacity key={rule.id} onPress={() => handleRemoveApp(rule)}>
                  <Card style={styles.removeRow} padding="sm">
                    <View style={styles.removeTop}>
                      <View style={styles.removeIcon}>
                        <Text style={styles.removeIconText}>{rule.appName[0]}</Text>
                      </View>
                      <View style={styles.removeInfo}>
                        <Text style={styles.removeAppName}>{rule.appName}</Text>
                        <Text style={styles.removeType}>
                          {rule.ruleType === 'daily_limit' ? 'Daily Limit' : rule.ruleType === 'schedule' ? 'Schedule' : 'Blocked'}
                        </Text>
                      </View>
                      {removing === rule.packageName && (
                        <ActivityIndicator size="small" color={colors.danger} />
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

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
                      {event.unlockType === 'free' ? 'Free' : 'Paid'}
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
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditing(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.modalTitle}>Edit name</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              autoCapitalize="words"
              autoFocus
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditing(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveName} disabled={saving}>
                <Text style={styles.modalSaveText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  profileSection: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 32, color: '#fff' },
  profileName: { fontFamily: fonts.semiBold, fontSize: 20, color: colors.text },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  editIcon: { fontFamily: fonts.regular, fontSize: 18, color: colors.primary, marginTop: 2 },
  profileEmail: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  removeSection: { marginBottom: spacing.xl },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
  removeRow: { marginBottom: spacing.sm },
  removeTop: { flexDirection: 'row', alignItems: 'center' },
  removeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  removeIconText: { fontFamily: fonts.bold, fontSize: 16, color: colors.danger },
  removeInfo: { flex: 1 },
  removeBtn: { backgroundColor: colors.dangerSoft, borderColor: colors.danger, borderWidth: 1 },
  removeAppName: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  removeType: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text, marginBottom: spacing.sm },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalInput: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalCancel: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.text },
  modalSave: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#fff' },
});
