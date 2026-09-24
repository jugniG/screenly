import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authClient } from "@/lib/auth";

export default function Index() {
  const { data: session, isPending } = authClient.useSession() as any;
  const [setupDone, setSetupDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("setup_done")
      .then((val) => setSetupDone(!!val))
      .catch(() => setSetupDone(false));
  }, []);

  console.log('[IndexScreen] Evaluating state -> session:', session ? `${session?.user?.email} (${session?.user?.id})` : 'null', 'isPending:', isPending, 'setupDone:', setupDone);

  if (isPending || setupDone === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0E0F11" }}>
        <ActivityIndicator size="large" color="#5C6EFF" />
      </View>
    );
  }

  if (!session) {
    console.log('[IndexScreen] No session detected -> Redirecting to /onboarding');
    return <Redirect href="/onboarding" />;
  }

  if (!setupDone) {
    console.log('[IndexScreen] Session valid but setup not complete -> Redirecting to /setup');
    return <Redirect href="/setup" />;
  }

  console.log('[IndexScreen] Session valid and setup complete -> Redirecting to /(protected)/(tabs)');
  return <Redirect href={"/(protected)/(tabs)" as any} />;
}
