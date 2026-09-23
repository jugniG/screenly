import "../lib/polyfill";
import { Component, type ReactNode, useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Stack, useRouter, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authClient } from "@/lib/auth";
import { syncRules } from "@/lib/enforcer";
import { colors } from "@/components/ui/theme";

// @ts-ignore - uniwind css import
import "../global.css";

class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0E0E0E", padding: 24 }}>
          <Text style={{ color: "#fff", fontSize: 14, textAlign: "center", marginBottom: 16 }}>
            {this.state.error.message || "Something went wrong"}
          </Text>
          <TouchableOpacity onPress={() => this.setState({ error: null })}>
            <Text style={{ color: "#5C6EFF", fontSize: 16 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  const { data: session, isPending, isFetching } = authClient.useSession() as any;
  const [setupDone, setSetupDone] = useState(false);
  const [setupChecked, setSetupChecked] = useState(false);
  const navigationState = useRootNavigationState();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem("setup_done")
      .then((val) => {
        if (isMounted) {
          setSetupDone(!!val);
          setSetupChecked(true);
        }
      })
      .catch(() => {
        if (isMounted) setSetupChecked(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!fontsLoaded || isPending || isFetching || !setupChecked) return;
    if (!navigationState?.key) return;
    if (!session) {
      router.replace("/onboarding" as any);
    } else if (!setupDone) {
      router.replace("/setup" as any);
    } else {
      syncRules().catch(() => {});
    }
  }, [fontsLoaded, isPending, isFetching, session, setupDone, setupChecked, navigationState?.key]);

  if (!fontsLoaded || isPending || isFetching || !setupChecked) {
    return <View style={{ flex: 1, backgroundColor: "#0E0F11", justifyContent: "center", alignItems: "center" }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <RouteErrorBoundary>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </RouteErrorBoundary>
        <StatusBar style="dark" />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
