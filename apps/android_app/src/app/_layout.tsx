import "../lib/polyfill";
import { Component, type ReactNode, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
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

  const { data: session } = authClient.useSession() as any;

  useEffect(() => {
    if (session) {
      syncRules().catch(() => { });
    }
  }, [session]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HeroUINativeProvider>
          <RouteErrorBoundary>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
              <Stack screenOptions={{ headerShown: false }} />
            </SafeAreaView>
          </RouteErrorBoundary>
          <StatusBar style="dark" />
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
