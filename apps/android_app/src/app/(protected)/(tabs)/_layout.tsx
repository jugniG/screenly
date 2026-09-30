import { Ionicons } from "@expo/vector-icons";
import { Tabs, Redirect, useRouter } from "expo-router";
import type { ComponentProps, JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, TouchableOpacity, View } from "react-native";
import type { ColorValue } from "react-native";
import { Avatar } from "heroui-native";
import { Text } from "react-native";
import { getLocalDateString, getScreenTimeData, getTopApps, getTotalMinutes } from "@/lib/screenTime";
import { orpcClient } from "@/lib/orpc";
import { syncRules } from "@/lib/enforcer";

import { authClient } from "@/lib/auth";
import ScreenlyEnforcer from "@/modules/screenly-enforcer/src/ScreenlyEnforcerModule";
import { colors } from "@/components/ui/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, color }: { name: IoniconName; color: ColorValue }): JSX.Element {
  return <Ionicons name={name} size={24} color={color} />;
}

function SharedHeader(): JSX.Element {
  const router = useRouter();
  const { data: session } = authClient.useSession() as any;
  const user = session?.user ?? { name: null, email: "user@example.com", image: null };
  const displayName = user.name ?? user.email;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <Pressable onPress={() => router.push("/account" as any)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Avatar size="sm" alt={displayName}>
          <Avatar.Image source={{ uri: user.image ?? undefined }} />
          <Avatar.Fallback style={{ backgroundColor: colors.surfaceAlt }}>
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>{displayName.slice(0, 1).toUpperCase()}</Text>
          </Avatar.Fallback>
        </Avatar>
        <View>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "500" }}>Hi,</Text>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>{displayName}</Text>
        </View>
      </Pressable>
      <TouchableOpacity
        onPress={() => router.push("/add-rule" as any)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: colors.primary,
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 20,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <Ionicons name="add" size={16} color="#FFFFFF" />
        <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}>Add App</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TabsLayout(): JSX.Element {
  const { data: session, isPending } = authClient.useSession() as any;
  // Async perm check - show loading until resolved, never flash onboarding/setup
  const [permsOk, setPermsOk] = useState<boolean | null>(null);
  const hasSyncedRef = useRef(false);

  const checkPerms = async () => {
    try {
      const [hasUsage, hasA11y] = await Promise.all([
        ScreenlyEnforcer.hasUsageStatsPermission(),
        ScreenlyEnforcer.isAccessibilityServiceEnabled(),
      ]);
      setPermsOk(hasUsage && hasA11y);
    } catch {
      setPermsOk(false);
    }
  };

  useEffect(() => {
    checkPerms();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkPerms();
        syncRules().catch(() => { });
      }
    });
    return () => sub.remove();
  }, []);

  // Leaderboard snapshot + rules sync - once per app open (not on tab switch)
  useEffect(() => {
    if (hasSyncedRef.current) return;
    if (permsOk !== true) return;
    hasSyncedRef.current = true;
    (async () => {
      try {
        await syncRules();
      } catch { }
      try {
        const today = getLocalDateString();
        const data = await getScreenTimeData();
        const totalMinutes = getTotalMinutes(data);
        const topApps = getTopApps(data, 3);
        await orpcClient.syncSnapshot({ date: today, totalMinutes, topApps });
      } catch { }
    })();
  }, [permsOk]);

  if (isPending || permsOk === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/onboarding" />;
  }

  if (permsOk === false) {
    return <Redirect href="/setup" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SharedHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Screen Time",
            tabBarIcon: ({ color }) => <TabIcon name="time-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="limits"
          options={{
            title: "Limits",
            tabBarIcon: ({ color }) => <TabIcon name="shield-checkmark-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: "Leaderboard",
            tabBarIcon: ({ color }) => <TabIcon name="trophy-outline" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
