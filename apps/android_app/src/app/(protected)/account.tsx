import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, Button, Card } from "heroui-native";
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
  const { data: session } = authClient.useSession() as any;
  const [rules, setRules] = useState<Rule[]>([]);
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

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
    <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Header back */}
        <Pressable onPress={() => router.back()} style={{ paddingVertical: 8 }}>
          <Text style={{ color: "#111", fontWeight: "600" }}>← Back</Text>
        </Pressable>

        {/* Profile */}
        <Card style={{ alignItems: "center", padding: 24, gap: 12 }}>
          <Avatar size="lg" alt={displayName}>
            <Avatar.Image source={{ uri: session?.user?.image ?? undefined }} />
            <Avatar.Fallback>{displayName.slice(0, 1).toUpperCase()}</Avatar.Fallback>
          </Avatar>
          <Pressable onPress={() => { setNameInput(session?.user?.name ?? ""); setEditing(true); }} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontWeight: "700", fontSize: 18 }}>{displayName}</Text>
            <Text style={{ color: "#6B7280" }}>✎</Text>
          </Pressable>
          <Text style={{ color: "#6B7280" }}>{email}</Text>
        </Card>

        {/* Rules */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontWeight: "700" }}>App Restrictions ({rules.filter((r) => r.enabled).length})</Text>
          {rules.length === 0 ? (
            <Text style={{ color: "#6B7280", textAlign: "center", paddingVertical: 12 }}>No apps restricted</Text>
          ) : (
            rules.map((r) => (
              <View key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {icons[r.packageName] ? <Image source={{ uri: icons[r.packageName] }} style={{ width: 36, height: 36 }} /> : <Text style={{ fontWeight: "700" }}>{r.appName[0]}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600" }}>{r.appName}</Text>
                  <Text style={{ color: "#6B7280", fontSize: 12 }}>{r.ruleType}</Text>
                </View>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={async () => {
                    try {
                      await orpcClient.deleteRule({ id: r.id });
                      setRules((prev) => prev.filter((x) => x.id !== r.id));
                    } catch {
                      Alert.alert("Error", "Could not remove");
                    }
                  }}
                >
                  Remove
                </Button>
              </View>
            ))
          )}
        </Card>

        <Button
          variant="secondary"
          onPress={async () => {
            await authClient.signOut();
            router.replace("/(auth)/sign-in" as any);
          }}
        >
          Sign Out
        </Button>
      </ScrollView>

      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <Pressable onPress={() => setEditing(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 16 }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, width: "100%", maxWidth: 320, gap: 12 }}>
            <Text style={{ fontWeight: "700", textAlign: "center" }}>Edit name</Text>
            <View style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 12 }}>
              <TextInput value={nameInput} onChangeText={setNameInput} placeholder="Your name" autoFocus />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button variant="secondary" style={{ flex: 1 }} onPress={() => setEditing(false)}>
                Cancel
              </Button>
              <Button
                style={{ flex: 1 }}
                isDisabled={saving}
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
                {saving ? <ActivityIndicator color="#fff" /> : "Save"}
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
