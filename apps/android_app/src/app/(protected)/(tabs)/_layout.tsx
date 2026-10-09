import { Ionicons } from "@expo/vector-icons";
import { Tabs, Redirect, useRouter } from "expo-router";
import type { ComponentProps, JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, TouchableOpacity, View } from "react-native";
import type { ColorValue } from "react-native";
import { Text } from "react-native";
import { Avatar } from "heroui-native";
import { getLocalDateString, getScreenTimeData, getTopApps, getTotalMinutes } from "@/lib/screenTime";
import { orpcClient } from "@/lib/orpc";
import { syncRules } from "@/lib/enforcer";
import { hasRequiredPermissions } from "@/lib/permissions";

import { authClient } from "@/lib/auth";
import { colors } from "@/components/ui/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

/** Icon + label only — the navigation bar inset is reserved by the root view. */
const TAB_BAR_CONTENT_HEIGHT = 49;

function TabIcon({ name, color }: { name: IoniconName; color: ColorValue }): JSX.Element {
  return <Ionicons name={name} size={24} color={color} />;
}

function SharedHeader(): JSX.Element {
  const router = useRouter();
  const { data: session } = authClient.useSession() as any;
  const user = session?.user;
  const displayName = user ? (user.name ?? user.email) : null;

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
      {user ? (
        <Pressable onPress={() => router.push("/account" as any)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Avatar size="sm" alt={displayName || "User"}>
            <Avatar.Image source={{ uri: user.image ?? undefined }} />
            <Avatar.Fallback style={{ backgroundColor: colors.surfaceAlt }}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>{displayName ? displayName.slice(0, 1).toUpperCase() : "U"}</Text>
            </Avatar.Fallback>
          </Avatar>
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "500" }}>Hi,</Text>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>{displayName}</Text>
          </View>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push("/(auth)/sign-in" as any)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Avatar size="sm" alt="Guest">
            <Avatar.Fallback style={{ backgroundColor: colors.surfaceAlt }}>
              <Ionicons name="person-outline" size={16} color={colors.primary} />
            </Avatar.Fallback>
          </Avatar>
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "500" }}>Welcome</Text>
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>Sign In</Text>
          </View>
        </Pressable>
      )}
      <TouchableOpacity
        onPress={() =>
          // Signed out there is nothing to save a rule to, so send them
          // straight to sign-in rather than into a form they cannot submit.
          router.push(session ? ("/add-rule" as any) : ("/(auth)/sign-in" as any))
        }
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
  const { data: session } = authClient.useSession() as any;
  const router = useRouter();
  const hasSyncedRef = useRef(false);
  const permCheckInFlight = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !session) return;
      syncRules().catch(() => {});

      // Both permissions can be revoked outside the app — from Settings, or by
      // Android on update — and the enforcer then blocks nothing while every
      // screen still looks healthy. Re-check on each resume and send the user
      // back through setup if either is gone.
      if (permCheckInFlight.current) return;
      permCheckInFlight.current = true;
      hasRequiredPermissions()
        .then((ok) => {
          if (ok) return;
          if (router.canGoBack()) return; // already navigating elsewhere
          router.replace("/setup" as any);
        })
        .catch(() => {})
        .finally(() => {
          permCheckInFlight.current = false;
        });
    });
    return () => sub.remove();
  }, [session]);

  // Leaderboard snapshot + rules sync - once per app open (not on tab switch)
  useEffect(() => {
    if (hasSyncedRef.current) return;
    if (!session) return;
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
  }, [session]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SharedHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            // The root SafeAreaView reserves the bottom inset for the system
            // navigation bar, so the bar is only as tall as its content. Left
            // to the navigator it adds that inset itself, which is what put a
            // void under the labels.
            height: TAB_BAR_CONTENT_HEIGHT,
            // ...and the navigator pads its own height by that same inset, which
            // would squeeze the labels out of the box above.
            paddingTop: 0,
            paddingBottom: 0,
            // Same tone as the page and the system navigation bar below it —
            // surface (#FCFBF9) on background (#F4F1EB) reads as a white stripe.
            backgroundColor: colors.background,
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
