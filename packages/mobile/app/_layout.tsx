import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authClient } from '../lib/auth';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular':  require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium':   require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold':     require('../assets/fonts/Poppins-Bold.ttf'),
  });

  const { data: session, isPending } = authClient.useSession();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then((val) => {
      setOnboardingDone(!!val);
      setOnboardingChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!fontsLoaded || isPending || !onboardingChecked) return;

    if (!onboardingDone) {
      router.replace('/onboarding');
    } else if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/sign-in');
    }
  }, [fontsLoaded, isPending, session, onboardingChecked, onboardingDone]);

  if (!fontsLoaded || isPending || !onboardingChecked) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
