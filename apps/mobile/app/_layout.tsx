import { useEffect, useState, useRef, Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
import { Stack, router, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authClient } from '../lib/auth';
import { syncRules } from '../lib/enforcer';

const DEEP_LINK_ROUTES = ['block', 'remove-confirm', 'unlock-confirm'];

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
    'Poppins-Regular':  require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium':   require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold':     require('../assets/fonts/Poppins-Bold.ttf'),
  });

  const { data: session, isPending, isFetching, refetch } = authClient.useSession() as any;
  const [setupDone, setSetupDone] = useState(false);
  const [setupChecked, setSetupChecked] = useState(false);
  const segments = useSegments();
  const redirected = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem('setup_done').then((val) => {
      setSetupDone(!!val);
      setSetupChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!fontsLoaded || isPending || isFetching || !setupChecked) return;
    if (redirected.current) return;

    const root = segments[0];
    if (root && DEEP_LINK_ROUTES.includes(root)) return;

    redirected.current = true;

    if (session) {
      if (!setupDone) {
        router.replace('/setup');
      } else {
        syncRules();
        router.replace('/(tabs)');
      }
    } else {
      router.replace('/onboarding');
    }
  }, [fontsLoaded, isPending, isFetching, session, setupDone, setupChecked, segments]);

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
