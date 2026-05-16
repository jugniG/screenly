import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RuleBadge } from '../../components/ui/RuleBadge';
import { colors, fonts, spacing } from '../../components/ui/theme';
import { apiFetch } from '../../lib/fetchApi';
import { syncRules } from '../../lib/enforcer';

interface Rule {
  id: string;
  packageName: string;
  appName: string;
  ruleType: 'daily_limit' | 'schedule' | 'block_always';
  limitMinutes: number | null;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  enabled: boolean;
}

export default function AppsScreen() {
  const [rules, setRules]     = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const res = await apiFetch('/api/rules');
      if (res.ok) {
        const rules = await res.json();
        setRules(rules);
        syncRules();
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function toggleRule(id: string, enabled: boolean) {
    try {
      await apiFetch(`/api/rules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !enabled }),
      });
      setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !enabled } : r));
      syncRules();
    } catch {
      Alert.alert('Error', 'Could not update rule');
    }
  }

  async function deleteRule(id: string) {
    Alert.alert('Delete Rule', 'Remove this rule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/rules/${id}`, {
              method: 'DELETE',
            });
            setRules(prev => prev.filter(r => r.id !== id));
            syncRules();
          } catch {
            Alert.alert('Error', 'Could not delete rule');
          }
        },
      },
    ]);
  }

  function ruleValue(rule: Rule) {
    if (rule.ruleType === 'daily_limit' && rule.limitMinutes) return `${rule.limitMinutes}m`;
    if (rule.ruleType === 'schedule' && rule.scheduleStart && rule.scheduleEnd)
      return `${rule.scheduleStart}–${rule.scheduleEnd}`;
    return undefined;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>My Apps</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-rule')}>
          <Text style={styles.addBtnText}>+ Add Rule</Text>
        </TouchableOpacity>
      </View>

      {rules.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛡️</Text>
          <Text style={styles.emptyTitle}>No rules yet</Text>
          <Text style={styles.emptySubtitle}>Add rules to block or limit apps</Text>
          <Button title="Add Rule" onPress={() => router.push('/add-rule')} style={{ marginTop: spacing.lg }} />
        </View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => (
            <Card style={[styles.ruleCard, !item.enabled ? styles.ruleCardDisabled : undefined]}>
              <View style={styles.ruleTop}>
                <View style={styles.appIconPlaceholder}>
                  <Text style={styles.appIconText}>{item.appName[0]}</Text>
                </View>
                <View style={styles.ruleInfo}>
                  <Text style={styles.appName}>{item.appName}</Text>
                  <Text style={styles.packageName}>{item.packageName}</Text>
                </View>
                {/* Toggle */}
                <TouchableOpacity
                  style={[styles.toggle, item.enabled && styles.toggleOn]}
                  onPress={() => toggleRule(item.id, item.enabled)}
                >
                  <View style={[styles.toggleThumb, item.enabled && styles.toggleThumbOn]} />
                </TouchableOpacity>
              </View>

              <View style={styles.ruleBottom}>
                <RuleBadge type={item.ruleType} value={ruleValue(item)} />
                <TouchableOpacity onPress={() => deleteRule(item.id)}>
                  <Text style={styles.deleteBtn}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  addBtnText: { fontFamily: fonts.semiBold, fontSize: 13, color: '#fff' },
  list: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  ruleCard: { gap: spacing.sm },
  ruleCardDisabled: { opacity: 0.5 },
  ruleTop: { flexDirection: 'row', alignItems: 'center' },
  appIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  appIconText: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary },
  ruleInfo: { flex: 1 },
  appName: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text },
  packageName: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.primary },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  ruleBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deleteBtn: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  emptySubtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm },
});
