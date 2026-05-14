import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { authClient } from '../../lib/auth';
import { colors, fonts } from '../../components/ui/theme';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ token?: string }>();

  useEffect(() => {
    // Magic link token arrives via deep link: screenly://auth/callback?token=xxx
    if (params.token) {
      (authClient as any).magicLink.verify({ query: { token: params.token } })
        .then(({ error }: any) => {
          if (error) {
            router.replace('/(auth)/sign-in');
          } else {
            router.replace('/(tabs)');
          }
        })
        .catch(() => router.replace('/(auth)/sign-in'));
    } else {
      // Google OAuth callback — session should be set already
      router.replace('/(tabs)');
    }
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
