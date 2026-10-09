import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "heroui-native";
import { colors } from "@/components/ui/theme";
import { orpcClient } from "@/lib/orpc";
import { authClient } from "@/lib/auth";

type Period = "today" | "yesterday" | "7d" | "30d";
type LeaderboardRow = Awaited<ReturnType<typeof orpcClient.getLeaderboard>>[number];
type PendingInvite = Awaited<ReturnType<typeof orpcClient.listInvites>>[number];
// The snapshot column is untyped on the server, so top apps arrive as `any`
type TopApp = { packageName: string; appName: string; minutes: number };

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
];

function formatMinutes(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function topAppsSummary(topApps: TopApp[] | null | undefined): string {
  if (!topApps?.length) return "No app data yet";
  return topApps.map((a) => `${a.appName} ${formatMinutes(a.minutes)}`).join("  ·  ");
}

function errorText(e: unknown, fallback: string): string {
  const err = e as { message?: string; data?: { message?: string } } | null;
  return err?.data?.message ?? err?.message ?? fallback;
}

function initials(label: string) {
  return label.slice(0, 1).toUpperCase();
}

export default function LeaderboardTab() {
  const router = useRouter();
  const { data: session } = authClient.useSession() as any;
  const myId: string | undefined = session?.user?.id;

  const [period, setPeriod] = useState<Period>("today");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteNote, setInviteNote] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [invites, setInvites] = useState<PendingInvite[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [boardRows, pendingInvites] = await Promise.all([
        orpcClient.getLeaderboard({ period }).catch(() => []),
        session ? orpcClient.listInvites({}).catch(() => []) : Promise.resolve([]),
      ]);
      setRows(boardRows as any);
      setInvites(pendingInvites as any);
    } catch {
      setRows([]);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, [period, session]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const sendInvite = async () => {
    const email = inviteEmail.trim();
    if (!email || inviteBusy) return;
    setInviteBusy(true);
    setInviteNote(null);
    try {
      await orpcClient.sendInvite({ email });
      setInviteEmail("");
      setInviteNote({ tone: "ok", text: `Invite sent to ${email}` });
    } catch (e) {
      setInviteNote({ tone: "error", text: errorText(e, "Could not send invite") });
    } finally {
      setInviteBusy(false);
    }
  };

  const respond = async (requestId: string, action: "accept" | "decline") => {
    try {
      if (action === "accept") await orpcClient.acceptInvite({ requestId });
      else await orpcClient.declineInvite({ requestId });
      await load();
    } catch (e) {
      setInviteNote({ tone: "error", text: errorText(e, "Could not update that request") });
    }
  };

  // Rows arrive sorted by the server with rank 1 = least screen time.
  const leaderMinutes = rows.find((r) => r.rank === 1)?.totalMinutes ?? 0;
  const worstMinutes = Math.max(1, ...rows.map((r) => r.totalMinutes));
  const myRank = rows.find((r) => r.userId === myId)?.rank;
  const pendingCount = invites.length;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={rows}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            <View className="mb-3">
              <Text className="text-xl font-bold text-foreground">Leaderboard</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">Least screen time wins</Text>
            </View>

            {/* Period switcher */}
            <View className="flex-row bg-surface border border-border rounded-xl p-1 gap-1 shadow-xs">
              {PERIODS.map(({ key, label }) => {
                const active = key === period;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setPeriod(key)}
                    className={`flex-1 items-center justify-center py-1.5 rounded-lg ${active ? "bg-primary" : "bg-surface"}`}
                  >
                    <Text
                      className={`text-xs font-semibold ${active ? "text-white" : "text-muted-foreground"}`}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!session && (
              <View className="bg-surface border border-border rounded-xl p-3.5 mt-3 flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-semibold text-foreground">Compete with friends</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">Sign in to join the leaderboard and track rankings.</Text>
                </View>
                <TouchableOpacity
                  className="bg-primary px-3.5 py-2 rounded-xl active:opacity-80"
                  onPress={() => router.push('/(auth)/sign-in' as any)}
                >
                  <Text className="text-white text-xs font-semibold">Sign In</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Invite — collapsed until asked for */}
            <Pressable
              onPress={() => setInviteOpen((open) => !open)}
              className="flex-row items-center gap-3 bg-surface border border-border rounded-xl p-3 mt-3 active:opacity-70"
            >
              <View className="w-8 h-8 rounded-lg bg-primary-light items-center justify-center">
                <Ionicons name="person-add-outline" size={16} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">Invite a friend</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {pendingCount > 0 ? `${pendingCount} waiting for you` : "Compare screen time together"}
                </Text>
              </View>
              {pendingCount > 0 && (
                <View className="h-5 px-1.5 rounded-full bg-primary items-center justify-center">
                  <Text className="text-xs font-bold text-white">{pendingCount}</Text>
                </View>
              )}
              <Ionicons name={inviteOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
            </Pressable>

            {inviteOpen && (
              <View className="bg-surface border border-border rounded-xl p-4 mt-2">
                <View className="flex-row items-center gap-2">
                  <TextInput
                    placeholder="friend@email.com"
                    placeholderTextColor={colors.textMuted}
                    value={inviteEmail}
                    onChangeText={(t) => {
                      setInviteEmail(t);
                      setInviteNote(null);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    style={{
                      flex: 1,
                      height: 44,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceAlt,
                      color: colors.text,
                      fontSize: 14,
                    }}
                  />
                  <TouchableOpacity
                    onPress={sendInvite}
                    disabled={inviteBusy || !inviteEmail.trim()}
                    className={`h-11 px-4 rounded-xl items-center justify-center ${inviteBusy || !inviteEmail.trim() ? "bg-primary opacity-40" : "bg-primary"}`}
                  >
                    {inviteBusy ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-white text-sm font-semibold">Send</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {inviteNote && (
                  <Text
                    className="text-xs mt-2"
                    style={{ color: inviteNote.tone === "ok" ? colors.success : colors.danger }}
                  >
                    {inviteNote.text}
                  </Text>
                )}

                {pendingCount > 0 && (
                  <View className="gap-2.5 mt-4">
                    <Text className="text-xs font-semibold tracking-wider text-muted-foreground">
                      PENDING REQUESTS
                    </Text>
                    {invites.map((inv) => {
                      const who = inv.requester?.name ?? inv.requester?.email ?? "Unknown";
                      return (
                        <View key={inv.requestId} className="flex-row items-center gap-2">
                          <Avatar size="sm" alt={who}>
                            <Avatar.Image source={{ uri: inv.requester?.image ?? undefined }} />
                            <Avatar.Fallback style={{ backgroundColor: colors.surfaceAlt }}>
                              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>
                                {initials(who)}
                              </Text>
                            </Avatar.Fallback>
                          </Avatar>
                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                              {who}
                            </Text>
                            {inv.requester?.name ? (
                              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                                {inv.requester.email}
                              </Text>
                            ) : null}
                          </View>
                          <TouchableOpacity
                            onPress={() => respond(inv.requestId, "accept")}
                            className="bg-primary px-3 py-1.5 rounded-lg"
                          >
                            <Text className="text-white text-xs font-semibold">Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => respond(inv.requestId, "decline")}
                            className="bg-surface-alt border border-border px-3 py-1.5 rounded-lg"
                          >
                            <Text className="text-muted-foreground text-xs font-semibold">Decline</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            <View className="flex-row items-center justify-between mt-4 mb-2 px-1">
              <Text className="text-xs font-semibold tracking-wider text-muted-foreground">
                STANDINGS ({rows.length})
              </Text>
              {loading && rows.length > 0 ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : myRank ? (
                <Text className="text-xs text-muted-foreground">
                  You’re #{myRank} of {rows.length}
                </Text>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View className="py-12 items-center justify-center px-4">
              <Ionicons name="trophy-outline" size={28} color={colors.textMuted} />
              <Text className="text-center text-sm text-muted-foreground leading-5 mt-3">
                No standings for this period yet.
              </Text>
              <Text className="text-center text-xs text-muted-foreground leading-5 mt-1">
                Invite a friend and whoever keeps their screen time lowest takes the top spot.
              </Text>
              <TouchableOpacity
                onPress={() => setInviteOpen(true)}
                className="mt-4 bg-primary px-5 py-2.5 rounded-xl"
              >
                <Text className="text-white font-semibold">Invite a friend</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isYou = item.userId === myId;
          const isLeader = item.rank === 1;
          const label = item.name ?? item.email ?? "Unknown";
          const barWidth = Math.max(8, Math.round((item.totalMinutes / worstMinutes) * 100));
          const gap = item.totalMinutes - leaderMinutes;

          return (
            <View
              className={`p-3 rounded-xl mb-2 ${isYou ? "bg-primary-light border border-primary" : "bg-surface border border-border"}`}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center ${isLeader ? "bg-primary" : "bg-surface-alt"}`}
                >
                  {isLeader ? (
                    <Ionicons name="trophy" size={13} color="#fff" />
                  ) : (
                    <Text
                      className="text-xs font-bold"
                      style={{ color: isYou ? colors.primary : colors.textMuted }}
                    >
                      {item.rank}
                    </Text>
                  )}
                </View>

                <Avatar size="sm" alt={label}>
                  <Avatar.Image source={{ uri: item.image ?? undefined }} />
                  <Avatar.Fallback style={{ backgroundColor: colors.surfaceAlt }}>
                    <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>
                      {initials(label)}
                    </Text>
                  </Avatar.Fallback>
                </Avatar>

                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                      {label}
                    </Text>
                    {isYou && (
                      <View className="bg-primary px-1.5 py-0.5 rounded-full">
                        <Text className="text-white text-xs font-semibold">You</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                    {topAppsSummary(item.topApps)}
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="text-sm font-bold text-foreground">
                    {formatMinutes(item.totalMinutes)}
                  </Text>
                  <Text
                    className="text-xs text-muted-foreground"
                    style={isLeader ? { color: colors.success } : undefined}
                  >
                    {isLeader ? "best" : `+${formatMinutes(gap)}`}
                  </Text>
                </View>
              </View>

              <View className="h-1.5 rounded-full bg-surface-alt mt-3 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${barWidth}%`, backgroundColor: isYou ? colors.primary : colors.borderSoft }}
                />
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
