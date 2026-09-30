import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { authClient } from "@/lib/auth";
import { colors } from "@/components/ui/theme";

export default function ProtectedLayout() {
  const { data: session, isPending } = authClient.useSession() as any;

  console.log('[ProtectedLayout] Guard evaluating -> session:', session ? `${session?.user?.email} (${session?.user?.id})` : 'null', 'isPending:', isPending);

  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    console.log('[ProtectedLayout] Access blocked: No active session -> Redirecting to /onboarding');
    return <Redirect href="/onboarding" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
