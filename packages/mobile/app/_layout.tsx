import { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authClient } from '../lib/auth';
import { syncRules } from '../lib/enforcer';

const DEEP_LINK_ROUTES = ['block', 'remove-confirm', 'unlock-confirm'];

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular':  require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium':   require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold':     require('../assets/fonts/Poppins-Bold.ttf'),
  });

  const { data: session, isPending } = authClient.useSession();
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
    if (!fontsLoaded || isPending || !setupChecked) return;
    if (redirected.current) return;

    // Don't redirect away from deep link screens
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
  }, [fontsLoaded, isPending, session, setupDone, setupChecked, segments]);

  if (!fontsLoaded || isPending || !setupChecked) {
    return <View style={{ flex: 1, backgroundColor: '#0E0E0E' }} />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
