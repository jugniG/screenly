import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { authClient } from '../lib/auth';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular':    require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium':     require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold':   require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold':       require('../assets/fonts/Poppins-Bold.ttf'),
  });

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!fontsLoaded || isPending) return;
    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/sign-in');
    }
  }, [fontsLoaded, isPending, session]);

  if (!fontsLoaded || isPending) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
