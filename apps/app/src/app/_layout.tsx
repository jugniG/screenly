import '../lib/polyfill';
import { useEffect, useState, useCallback, Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
    'Poppins-Regular':  require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium':   require('../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold':     require('../../assets/fonts/Poppins-Bold.ttf'),
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
        orpc('updateUserWallet', { solanaWallet: wallet.publicKey.toBase58() }).catch(() => {});
      });
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
      router.replace('/(tabs)');
    }
  }, [fontsLoaded, isPending, isFetching, session, setupDone, setupChecked, navigationState?.key]);

  if (!fontsLoaded || isPending || isFetching || !setupChecked) {
    return <View style={{ flex: 1, backgroundColor: '#0E0E0E' }} />;
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
