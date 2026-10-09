import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Avatar } from "heroui-native";
import { Card } from "@/components/ui/Card";
import { colors } from "@/components/ui/theme";
import { authClient } from "@/lib/auth";
import { orpcClient } from "@/lib/orpc";
import ScreenlyEnforcer from "@/modules/screenly-enforcer/src/ScreenlyEnforcerModule";

type Rule = {
  id: string;
  packageName: string;
  appName: string;
  ruleType: string;
  enabled: boolean;
};

export default function AccountScreen() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession() as any;
  const [rules, setRules] = useState<Rule[]>([]);
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isPending && !session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const loadRules = useCallback(async () => {
    try {
      const list = (await orpcClient.listRules({})) as Rule[];
      setRules(list);
      if (list.length > 0) {
        const pkgs = JSON.stringify(list.map((r) => r.packageName));
        const str = await (ScreenlyEnforcer.getAppIcons(pkgs) as any);
        try {
          setIcons(JSON.parse(str as string));
        } catch {}
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const displayName = session?.user?.name ?? session?.user?.email ?? "U";
  const email = session?.user?.email ?? "";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Header back */}
        <Pressable onPress={() => router.dismissTo('/(protected)/(tabs)/limits' as any)} style={{ paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 15 }}>← Back</Text>
        </Pressable>

        {/* Profile */}
        <Card style={{ alignItems: "center", padding: 24, gap: 12 }}>
          <Avatar size="lg" alt={displayName}>
            <Avatar.Image source={{ uri: session?.user?.image ?? undefined }} />
            <Avatar.Fallback style={{ backgroundColor: colors.surfaceAlt }}>
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 24 }}>
                {displayName.slice(0, 1).toUpperCase()}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <Pressable
            onPress={() => {
              setNameInput(session?.user?.name ?? "");
              setEditing(true);
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <Text style={{ fontWeight: "700", fontSize: 20, color: colors.text }}>{displayName}</Text>
            <Text style={{ color: colors.primary, fontSize: 16 }}>✎</Text>
          </Pressable>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{email}</Text>
        </Card>

        {/* Rules */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontWeight: "700", fontSize: 16, color: colors.text }}>
            App Restrictions ({rules.filter((r) => r.enabled).length})
          </Text>
          {rules.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: "center", paddingVertical: 16 }}>No apps restricted</Text>
          ) : (
            rules.map((r) => (
              <View
                key={r.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: colors.surfaceAlt,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {icons[r.packageName] ? (
                    <Image source={{ uri: icons[r.packageName] }} style={{ width: 36, height: 36 }} />
                  ) : (
                    <Text style={{ fontWeight: "700", color: colors.primary }}>{r.appName[0]}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 14, color: colors.text }}>{r.appName}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>{r.ruleType}</Text>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await orpcClient.deleteRule({ id: r.id });
                      setRules((prev) => prev.filter((x) => x.id !== r.id));
                    } catch {
                      Alert.alert("Error", "Could not remove");
                    }
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.danger, fontSize: 12, fontWeight: "600" }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>

        <TouchableOpacity
          onPress={async () => {
            await authClient.signOut();
            // A draft belongs to the session that created it; carrying it into
            // the next sign-in would restore a rule for a different account.
            await AsyncStorage.removeItem('pending_add_rule').catch(() => {});
            router.dismissTo('/(protected)/(tabs)/limits' as any);
          }}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.danger,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.danger, fontWeight: "600", fontSize: 15 }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <Pressable onPress={() => setEditing(false)} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, width: "100%", maxWidth: 340, gap: 14 }}>
            <Text style={{ fontWeight: "700", fontSize: 16, textAlign: "center", color: colors.text }}>Edit Name</Text>
            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, backgroundColor: colors.surfaceAlt }}>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                style={{ color: colors.text, fontSize: 15, height: 44 }}
                autoFocus
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: colors.surfaceAlt, paddingVertical: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: colors.border }}
                onPress={() => setEditing(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={saving}
                style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: "center" }}
                onPress={async () => {
                  if (!nameInput.trim()) return;
                  setSaving(true);
                  try {
                    await (authClient as any).updateUser({ name: nameInput.trim() });
                    setEditing(false);
                  } catch (e: any) {
                    Alert.alert("Error", e.message ?? "Failed");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontWeight: "600" }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

