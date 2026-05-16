import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import ScreenlyEnforcer from '../../modules/screenly-enforcer';
import { colors, fonts, spacing, radius } from './theme';

interface AppInfo {
  appName: string;
  packageName: string;
  icon?: string;
}

interface AppPickerProps {
  onSelect: (app: { name: string; packageName: string }) => void;
  onCancel: () => void;
  existingPackages?: string[];
}

export default function AppPicker({ onSelect, onCancel, existingPackages = [] }: AppPickerProps) {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [nativeUnavailable, setNativeUnavailable] = useState(false);
  const [query, setQuery] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPkg, setManualPkg] = useState('');

  useEffect(() => {
    try {
      const list: AppInfo[] = ScreenlyEnforcer.getInstalledApps() as any;
      const sorted = list
        .filter(a => a.appName && a.packageName)
        .sort((a, b) => a.appName.localeCompare(b.appName));
      setApps(sorted);
    } catch {
      setNativeUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return apps;
    const q = query.toLowerCase();
    return apps.filter(
      a => a.appName.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q),
    );
  }, [apps, query]);

  if (showManual) {
    return (
      <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Enter app details</Text>
            <TextInput
              style={styles.input}
              placeholder="App name"
              placeholderTextColor={colors.textMuted}
              value={manualName}
              onChangeText={setManualName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Package name (e.g. com.instagram.android)"
              placeholderTextColor={colors.textMuted}
              value={manualPkg}
              onChangeText={setManualPkg}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setShowManual(false)} style={styles.btnOutline}>
                <Text style={styles.btnOutlineText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (manualName.trim() && manualPkg.trim()) {
                    onSelect({ name: manualName.trim(), packageName: manualPkg.trim() });
                  }
                }}
                style={[styles.btnPrimary, (!manualName.trim() || !manualPkg.trim()) && styles.btnDisabled]}
              >
                <Text style={styles.btnPrimaryText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.sheetTitle}>Choose an app</Text>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Loading installed apps...</Text>
            </View>
          ) : nativeUnavailable ? (
            <View style={styles.center}>
              <Text style={styles.unavailableIcon}>📦</Text>
              <Text style={styles.unavailableTitle}>Requires a dev build</Text>
              <Text style={styles.unavailableText}>
                Listing installed apps needs a native module not available in Expo Go.
                Use manual entry below, or run a dev build.
              </Text>
              <TouchableOpacity style={styles.manualBtn} onPress={() => setShowManual(true)}>
                <Text style={styles.manualBtnText}>Enter app manually</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.search}
                placeholder="Search apps..."
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <FlatList
                data={filtered}
                keyExtractor={item => item.packageName}
                style={styles.list}
                renderItem={({ item }) => {
                  const isAdded = existingPackages.includes(item.packageName);
                  return (
                    <TouchableOpacity
                      style={[styles.appItem, isAdded && styles.appItemDisabled]}
                      onPress={isAdded ? undefined : () => onSelect({ name: item.appName, packageName: item.packageName })}
                      activeOpacity={isAdded ? 1 : 0.7}
                    >
                      <View style={[styles.appIconPlaceholder, isAdded && styles.appIconPlaceholderDisabled]}>
                        <Text style={[styles.appIconText, isAdded && styles.appIconTextDisabled]}>{item.appName[0]}</Text>
                      </View>
                      <View style={styles.appInfo}>
                        <Text style={[styles.appName, isAdded && styles.appNameDisabled]}>{item.appName}</Text>
                        <Text style={styles.appPkg} numberOfLines={1}>{item.packageName}</Text>
                      </View>
                      {isAdded && (
                        <View style={styles.addedTag}>
                          <Text style={styles.addedTagText}>Added</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListFooterComponent={() => (
                  <TouchableOpacity style={styles.manualRow} onPress={() => setShowManual(true)}>
                    <Text style={styles.manualText}>✏️  App not listed? Enter manually</Text>
                  </TouchableOpacity>
                )}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  sheetTitle: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.text },
  cancel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  search: {
    fontFamily: fonts.regular, fontSize: 15, color: colors.text,
    backgroundColor: colors.bg, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  list: { maxHeight: 500 },
  appItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  appIconPlaceholder: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  appIconPlaceholderDisabled: { backgroundColor: colors.border },
  appIconText: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.primary },
  appIconTextDisabled: { color: colors.textMuted },
  appInfo: { flex: 1 },
  appName: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  appNameDisabled: { color: colors.textMuted },
  appItemDisabled: { opacity: 0.6 },
  addedTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    color:colors.text
  },
  addedTagText: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.textSecondary },
  appPkg: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  manualRow: {
    paddingVertical: spacing.md, alignItems: 'center',
  },
  manualText: { fontFamily: fonts.medium, fontSize: 14, color: colors.primary },
  center: {
    alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg,
  },
  loadingText: {
    fontFamily: fonts.regular, fontSize: 14,
    color: colors.textSecondary, marginTop: spacing.md,
  },
  unavailableIcon: { fontSize: 40, marginBottom: spacing.md },
  unavailableTitle: { fontFamily: fonts.semiBold, fontSize: 17, color: colors.text, marginBottom: spacing.sm },
  unavailableText: {
    fontFamily: fonts.regular, fontSize: 14,
    color: colors.textSecondary, textAlign: 'center', lineHeight: 21,
    marginBottom: spacing.lg,
  },
  manualBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  manualBtnText: { fontFamily: fonts.semiBold, fontSize: 15, color: '#fff' },
  input: {
    fontFamily: fonts.regular, fontSize: 15, color: colors.text,
    backgroundColor: colors.bg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btnOutline: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  btnOutlineText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  btnPrimary: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { fontFamily: fonts.semiBold, fontSize: 15, color: '#fff' },
});
