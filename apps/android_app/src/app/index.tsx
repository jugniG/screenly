import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("has_seen_onboarding")
      .then((val) => setHasSeenOnboarding(!!val))
      .catch(() => setHasSeenOnboarding(false));
  }, []);

  console.log('[IndexScreen] Evaluating state -> hasSeenOnboarding:', hasSeenOnboarding);

  if (hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0E0F11" }}>
        <ActivityIndicator size="large" color="#5C6EFF" />
      </View>
    );
  }

  if (!hasSeenOnboarding) {
    console.log('[IndexScreen] First time open -> Redirecting to /onboarding');
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={"/(protected)/(tabs)" as any} />;
}
