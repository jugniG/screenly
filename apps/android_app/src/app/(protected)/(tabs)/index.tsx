import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, Text, View } from "react-native";
import { Button, Card } from "heroui-native";
import { Calendar } from "react-native-calendars";
import { getScreenTimeData, type AppUsage } from "@/lib/screenTime";

function formatMinutes(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function ScreenTimeTab() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [data, setData] = useState<AppUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getScreenTimeData();
    // For now only today is supported natively - calendar filters same data
    // If selectedDate !== today, show empty (future: query native for that date)
    const today = new Date().toISOString().split("T")[0];
    if (selectedDate !== today) {
      setData([]);
    } else {
      setData(result);
    }
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const totalMinutes = data.reduce((s, a) => s + a.minutes, 0);

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      {/* Date picker bar */}
      <View style={{ padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#E5E7EB" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontWeight: "700", fontSize: 16 }}>Screen Time</Text>
          <Button size="sm" variant="secondary" onPress={() => setShowCalendar((v) => !v)}>
            {selectedDate}
          </Button>
        </View>
        <Text style={{ color: "#6B7280", marginTop: 4 }}>Total: {formatMinutes(totalMinutes)} • {data.length} apps</Text>
        {showCalendar && (
          <View style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB" }}>
            <Calendar
              current={selectedDate}
              markedDates={{ [selectedDate]: { selected: true, selectedColor: "#111" } }}
              onDayPress={(d: any) => {
                setSelectedDate(d.dateString);
                setShowCalendar(false);
              }}
              theme={{ todayTextColor: "#111", arrowColor: "#111", selectedDayBackgroundColor: "#111" }}
            />
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : data.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ color: "#6B7280", textAlign: "center" }}>No usage data for {selectedDate}. Grant Usage Access or use the app to generate data.</Text>
          <Button style={{ marginTop: 16 }} onPress={load}>Retry</Button>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.packageName}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item, index }) => (
            <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#E5E7EB", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {item.iconBase64 ? (
                  <Image source={{ uri: `data:image/png;base64,${item.iconBase64}` }} style={{ width: 36, height: 36 }} />
                ) : (
                  <Text style={{ fontWeight: "700", color: "#374151" }}>{item.appName.slice(0, 1).toUpperCase()}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600" }}>{item.appName}</Text>
                <Text style={{ color: "#6B7280", fontSize: 12 }}>{item.packageName}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontWeight: "700" }}>{formatMinutes(item.minutes)}</Text>
                <Text style={{ color: "#9CA3AF", fontSize: 12 }}>#{index + 1}</Text>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}
