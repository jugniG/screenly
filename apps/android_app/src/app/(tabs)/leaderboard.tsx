import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TextInput, View } from "react-native";
import { Avatar, Button, Card } from "heroui-native";
import { orpcClient } from "@/lib/orpc";

type Period = "today" | "yesterday" | "7d" | "30d";
type LeaderboardRow = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  totalMinutes: number;
  topApps: { packageName: string; appName: string; minutes: number }[];
  rank: number;
};

function formatMinutes(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function LeaderboardTab() {
  const [period, setPeriod] = useState<Period>("today");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await orpcClient.getLeaderboard({ period })) as LeaderboardRow[];
      setRows(res);
      const inv = (await orpcClient.listInvites({})) as any[];
      setInvites(inv);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      await orpcClient.sendInvite({ email: inviteEmail.trim() });
      setInviteEmail("");
      await load();
    } catch (e: any) {
      // TODO: toast error
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      {/* Period picker */}
      <View style={{ flexDirection: "row", gap: 8, padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#E5E7EB" }}>
        {(["today", "yesterday", "7d", "30d"] as Period[]).map((p) => (
          <Button key={p} size="sm" variant={period === p ? "primary" : "secondary"} onPress={() => setPeriod(p)}>
            {p}
          </Button>
        ))}
      </View>

      {/* Invite */}
      <View style={{ padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#E5E7EB", gap: 8 }}>
        <Text style={{ fontWeight: "700" }}>Invite friends</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 12, justifyContent: "center" }}>
            <TextInput placeholder="friend@email.com" value={inviteEmail} onChangeText={setInviteEmail} autoCapitalize="none" keyboardType="email-address" />
          </View>
          <Button size="sm" onPress={sendInvite} isDisabled={inviteLoading || !inviteEmail.trim()}>
            Invite
          </Button>
        </View>
        {invites.length > 0 && (
          <View style={{ gap: 8, marginTop: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 12, color: "#6B7280" }}>Pending invites</Text>
            {invites.map((inv: any) => (
              <View key={inv.requestId} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 8, backgroundColor: "#F9FAFB", borderRadius: 8 }}>
                <Text style={{ fontSize: 13 }}>{inv.requester?.email ?? inv.requester?.name ?? "Unknown"}</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={async () => {
                      await orpcClient.acceptInvite({ requestId: inv.requestId });
                      await load();
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={async () => {
                      await orpcClient.declineInvite({ requestId: inv.requestId });
                      await load();
                    }}
                  >
                    Decline
                  </Button>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : rows.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ color: "#6B7280", textAlign: "center" }}>No leaderboard data for {period}. Invite friends and sync screen time.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Card style={{ padding: 16, gap: 10, borderWidth: item.rank === 1 ? 2 : 0, borderColor: item.rank === 1 ? "#F59E0B" : undefined }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: item.rank === 1 ? "#FEF3C7" : "#E5E7EB", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontWeight: "700", color: item.rank === 1 ? "#92400E" : "#374151" }}>{item.rank}</Text>
                </View>
                <Avatar size="sm" alt={item.name ?? item.email ?? "U"}>
                  <Avatar.Image source={{ uri: item.image ?? undefined }} />
                  <Avatar.Fallback>{(item.name ?? item.email ?? "U").slice(0, 1).toUpperCase()}</Avatar.Fallback>
                </Avatar>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700" }}>{item.name ?? item.email ?? "Unknown"}</Text>
                  <Text style={{ color: "#6B7280", fontSize: 12 }}>{formatMinutes(item.totalMinutes)} total</Text>
                </View>
                {item.rank === 1 && <Text style={{ fontSize: 18 }}>🏆</Text>}
              </View>
              {item.topApps?.length > 0 && (
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {item.topApps.map((app) => (
                    <View key={app.packageName} style={{ backgroundColor: "#F3F4F6", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: "#374151" }}>
                        {app.appName} • {formatMinutes(app.minutes)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          )}
        />
      )}
    </View>
  );
}
