import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authClient } from '../../lib/auth';
import { routeAfterAuth } from '../../lib/permissions';
import { colors, fonts } from '../../components/ui/theme';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ token?: string }>();

  useEffect(() => {
    async function handleCallback() {
      const hasDraft = await AsyncStorage.getItem('pending_add_rule');
      const needsSetup = await routeAfterAuth();
      const target = needsSetup
        ? '/setup'
        : hasDraft
          ? '/add-rule'
          : '/(protected)/(tabs)';
      if (params.token) {
        const { error } = await (authClient as any).magicLink.verify({ query: { token: params.token } });
        if (error) {
          router.replace('/(auth)/sign-in');
        } else {
          router.replace(target as any);
        }
      } else {
        const { data: session } = await authClient.getSession();
        if (session) {
          router.replace(target as any);
        } else {
          router.replace('/(auth)/sign-in');
        }
      }
    }
    handleCallback();
  }, [params.token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Signing you in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
