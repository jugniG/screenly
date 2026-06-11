import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { authClient } from '../../lib/auth';
import { colors, fonts } from '../../components/ui/theme';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ token?: string }>();

  useEffect(() => {
    async function handleCallback() {
      if (params.token) {
        const { error } = await (authClient as any).magicLink.verify({ query: { token: params.token } });
        if (error) {
          router.replace('/(auth)/sign-in');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        const { data: session } = await authClient.getSession();
        if (session) {
          router.replace('/(tabs)');
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
