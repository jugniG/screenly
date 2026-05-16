import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { authClient } from '../../lib/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors, fonts, spacing } from '../../components/ui/theme';

export default function SignInScreen() {
  const { data: session } = authClient.useSession();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) router.replace('/(tabs)');
  }, [session]);

  async function handleMagicLink() {
    if (!email.trim()) { setError('Enter your email'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await (authClient as any).signIn.magicLink({
        email: email.trim(),
        callbackURL: 'screenly://auth/callback',
      });
      if (err) {
        Alert.alert('Error', err.message ?? 'Could not send link');
      } else {
        setSent(true);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const baseUrl = 'https://5205-103-190-15-162.ngrok-free.app';
      const callbackURL = `${baseUrl}/api/oauth/mobile-callback`;

      const result = await (authClient as any).signIn.social({
        provider: 'google',
        callbackURL,
        redirect: false,
      });

      const url = result?.data?.url ?? result?.url;
      if (url) {
        const browserResult = await WebBrowser.openAuthSessionAsync(url, callbackURL);

        if (browserResult.type === 'success') {
          const token = new URL(browserResult.url).searchParams.get('token');
          if (token) {
            router.push(`/auth/callback?token=${token}`);
          } else {
            const { data: session } = await authClient.getSession();
            if (session) router.replace('/(tabs)');
          }
        }
      } else if (result?.error) {
        Alert.alert('Google Sign-In Failed', result.error.message ?? 'Try again');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setGoogleLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.sentBox}>
          <Text style={styles.sentIcon}>&#x2709;&#xFE0F;</Text>
          <Text style={styles.sentTitle}>Check your inbox</Text>
          <Text style={styles.sentSubtitle}>
            We sent a sign-in link to{'\n'}
            <Text style={styles.sentEmail}>{email}</Text>
          </Text>
          <Button
            title="Resend link"
            variant="outline"
            onPress={() => setSent(false)}
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.brandName}>Screenly</Text>
          <Text style={styles.tagline}>Take back your screen time</Text>
        </View>

        {/* Magic Link */}
        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={v => { setEmail(v); setError(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            error={error}
          />
          <Button
            title={loading ? 'Sending...' : 'Send magic link'}
            onPress={handleMagicLink}
            disabled={loading || googleLoading}
            style={{ marginTop: spacing.lg }}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google */}
        <Button
          title={googleLoading ? 'Connecting...' : 'Continue with Google'}
          onPress={handleGoogle}
          disabled={loading || googleLoading}
          variant="outline"
          icon="google"
        />

        <Text style={styles.hint}>
          No account? A magic link will create one automatically.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 100,
    paddingBottom: spacing.xxl,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: { fontFamily: fonts.bold, fontSize: 36, color: '#fff' },
  brandName: { fontFamily: fonts.bold, fontSize: 28, color: colors.text },
  tagline: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  form: {},
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  sentBox: { alignItems: 'center' },
  sentIcon: { fontSize: 56, marginBottom: spacing.lg },
  sentTitle: { fontFamily: fonts.bold, fontSize: 24, color: colors.text, marginBottom: spacing.sm },
  sentSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sentEmail: { fontFamily: fonts.semiBold, color: colors.text },
});
