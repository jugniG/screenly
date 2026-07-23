import '../lib/polyfill';
import { useEffect, useState, useCallback, Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authClient } from '../lib/auth';
import { syncRules } from '../lib/enforcer';
import { loadOrCreateWallet } from '../lib/solana';
import { orpc } from '../lib/orpc';

class RouteErrorBoundary extends Component<{ children: ReactNode }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0E0E0E' }}>
        <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>Just a moment…</Text>
        <TouchableOpacity onPress={() => this.setState({ error: null })}>
          <Text style={{ color: '#5C6EFF', fontSize: 16 }}>Retry</Text>
        </TouchableOpacity>
      </View>;
    }
    return this.props.children;
  }
}

export default function RootLayout() {

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
  });

  const { data: session, isPending, isFetching } = authClient.useSession() as any;
  const [setupDone, setSetupDone] = useState(false);
  const [setupChecked, setSetupChecked] = useState(false);
  const navigationState = useRootNavigationState();
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('setup_done').then((val) => {
      setSetupDone(!!val);
      setSetupChecked(true);
    });
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadOrCreateWallet().then((wallet) => {
        orpc('updateUserWallet', { solanaWallet: wallet.publicKey.toBase58() }).catch(() => { });
      }).catch((e: any) => console.log('[Layout] wallet error:', e?.message));
    }
  }, [session]);


  useEffect(() => {
    if (!fontsLoaded || isPending || isFetching || !setupChecked) return;
    if (!navigationState?.key) return;

    if (!session) {
      router.replace('/onboarding');
    } else if (!setupDone) {
      router.replace('/setup');
    } else {
      syncRules();
    }
  }, [fontsLoaded, isPending, isFetching, session, setupDone, setupChecked, navigationState?.key]);

  // --- DEBUG: log what's blocking the loading screen ---
  useEffect(() => {
    console.log('[Layout:DEBUG] fontsLoaded:', fontsLoaded);
    console.log('[Layout:DEBUG] isPending:', isPending);
    console.log('[Layout:DEBUG] isFetching:', isFetching);
    console.log('[Layout:DEBUG] setupChecked:', setupChecked);
    console.log('[Layout:DEBUG] session:', session);
    console.log('[Layout:DEBUG] navigationState?.key:', navigationState?.key);
    console.log('[Layout:DEBUG] EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
  }, [fontsLoaded, isPending, isFetching, setupChecked, session, navigationState?.key]);

  if (!fontsLoaded || isPending || isFetching || !setupChecked) {
    const blockers = [
      !fontsLoaded && 'fontsLoaded=false',
      isPending && 'isPending=true',
      isFetching && 'isFetching=true',
      !setupChecked && 'setupChecked=false',
    ].filter(Boolean);

    return (
      <View style={{ flex: 1, backgroundColor: '#0E0F11', justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={require('../../assets/images/splash-icon.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <View style={{ position: 'absolute', bottom: 60, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 8, padding: 12 }}>
          <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>⏳ Stuck on loading — blockers:</Text>
          {blockers.map((b, i) => (
            <Text key={i} style={{ color: '#FFD93D', fontSize: 11 }}>• {b}</Text>
          ))}
          <Text style={{ color: '#888', fontSize: 10, marginTop: 6 }}>API: {process.env.EXPO_PUBLIC_API_URL ?? 'fallback (10.0.2.2:3000)'}</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <RouteErrorBoundary>
        <Stack screenOptions={{ headerShown: false }} />
      </RouteErrorBoundary>
    </>
  );
}
