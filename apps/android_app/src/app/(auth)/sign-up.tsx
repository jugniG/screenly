import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { authClient } from '../../lib/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors, fonts, spacing } from '../../components/ui/theme';

import * as SecureStore from 'expo-secure-store';

export default function SignUpScreen() {
  const { data: session, refetch } = authClient.useSession() as any;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('[GoogleAuth:SignUp] useSession updated:', session ? `User logged in: ${session?.user?.email} (${session?.user?.id})` : 'No active session');
    if (session) {
      console.log('[GoogleAuth:SignUp] Active session detected -> Navigating to /(protected)/(tabs)');
      router.replace('/(protected)/(tabs)' as any);
    }
  }, [session]);

  async function handleGoogle() {
    setError('');
    setGoogleLoading(true);
    console.log('[GoogleAuth:SignUp] Initiating Google social login (callback: screenly:///)...');
    try {
      const res = await (authClient as any).signIn.social({
        provider: 'google',
        callbackURL: 'screenly:///',
      });
      console.log('[GoogleAuth:SignUp] signIn.social response:', JSON.stringify(res));

      const storedCookie = await SecureStore.getItemAsync('screenly_cookie');
      console.log('[GoogleAuth:SignUp] Stored screenly_cookie in SecureStore:', storedCookie ? `Present (length ${storedCookie.length})` : 'MISSING/NULL');

      const sessionCheck = await authClient.getSession();
      console.log('[GoogleAuth:SignUp] authClient.getSession() result:', JSON.stringify(sessionCheck));

      if (res?.error) {
        console.error('[GoogleAuth:SignUp] Error from signIn.social:', res.error);
        setError(res.error.message ?? 'Could not sign in with Google');
        setGoogleLoading(false);
      } else {
        console.log('[GoogleAuth:SignUp] Refetching session...');
        await refetch();
        setGoogleLoading(false);
      }
    } catch (e: any) {
      console.error('[GoogleAuth:SignUp] Caught exception during Google sign-in:', e);
      setError(e.message ?? 'Something went wrong');
      setGoogleLoading(false);
    }
  }

  async function handleSendCode() {
    if (!name.trim()) { setError('Enter your name'); return; }
    if (!email.trim()) { setError('Enter your email'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await (authClient as any).emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: 'sign-in',
      });
      if (err) {
        Alert.alert('Error', err.message ?? 'Could not send code');
      } else {
        setStep('otp');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    if (!otp.trim()) { setError('Enter the code'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await (authClient as any).signIn.emailOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      if (err) {
        Alert.alert('Error', err.message ?? 'Invalid code');
      } else {
        await (authClient as any).updateUser({ name: name.trim() });
        await refetch();
        router.replace('/(protected)/(tabs)' as any);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Image source={require('../../../assets/images/icon.png')} style={styles.logoImage} />
          <Text style={styles.brandName}>Screenly</Text>
          <Text style={styles.tagline}>Take back your screen time</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Create account</Text>

          {step === 'email' ? (
            <>
              <Button
                title="Continue with Google"
                variant="secondary"
                icon="google"
                onPress={handleGoogle}
                loading={googleLoading}
                disabled={loading}
                style={{ marginBottom: spacing.md }}
              />
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <Input
                label="Name"
                value={name}
                onChangeText={v => setName(v)}
                autoCapitalize="words"
                autoComplete="name"
                placeholder="Your name"
                error={error && !name.trim() ? error : ''}
              />
              <Input
                label="Email"
                value={email}
                onChangeText={v => { setEmail(v); setError(''); }}
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                placeholder="you@example.com"
                error={error}
              />
              <Button
                title={loading ? 'Sending…' : 'Send code'}
                onPress={handleSendCode}
                disabled={loading}
                style={{ marginTop: spacing.lg }}
              />
            </>
          ) : (
            <>
              <Text style={styles.otpSentText}>
                Code sent to{'\n'}
                <Text style={styles.otpSentEmail}>{email}</Text>
              </Text>
              <Input
                label="Code"
                value={otp}
                onChangeText={v => { setOtp(v); setError(''); }}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                keyboardType="number-pad"
                placeholder="000000"
                maxLength={6}
                error={error}
              />
              <Button
                title={loading ? 'Creating account…' : 'Create account'}
                onPress={handleSignUp}
                disabled={loading}
                style={{ marginTop: spacing.lg }}
              />
              <Button
                title="Back"
                variant="outline"
                onPress={() => { setStep('email'); setOtp(''); setError(''); }}
                style={{ marginTop: spacing.sm }}
              />
            </>
          )}
        </View>

        <TouchableOpacity style={styles.footer} onPress={() => router.push('/(auth)/sign-in')}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Text style={styles.footerLink}>Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 48,
    paddingBottom: spacing.xxl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  brandName: { fontFamily: fonts.bold, fontSize: 28, color: colors.text },
  tagline: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  form: {},
  formTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  otpSentText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  otpSentEmail: { fontFamily: fonts.semiBold, color: colors.text },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.primary,
  },
});
