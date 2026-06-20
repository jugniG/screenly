import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts } from '../components/ui/theme';

export default function UnlockConfirm() {
  useEffect(() => {
    const t = setTimeout(() => router.replace('/(tabs)'), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Redirecting…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, marginTop: 12 },
});
