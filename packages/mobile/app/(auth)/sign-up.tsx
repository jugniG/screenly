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

export default function SignUpScreen() {
  const { data: session } = authClient.useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) router.replace('/(tabs)');
  }, [session]);

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
        router.replace('/(tabs)');
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
          <Image source={require('../../assets/icon.png')} style={styles.logoImage} />
          <Text style={styles.brandName}>Screenly</Text>
          <Text style={styles.tagline}>Take back your screen time</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Create account</Text>

          {step === 'email' ? (
            <>
              <Input
                label="Name"
                value={name}
                onChangeText={v => setName(v)}
                autoCapitalize="words"
                placeholder="Your name"
                error={error && !name.trim() ? error : ''}
              />
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
    paddingTop: 80,
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
