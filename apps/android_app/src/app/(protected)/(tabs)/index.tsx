import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/components/ui/theme";
import { ScreenTimeGraph } from "@/components/ui/ScreenTimeGraph";
import { getScreenTimeData, getLocalDateString, type AppUsage } from "@/lib/screenTime";
import ScreenlyEnforcer from "@/modules/screenly-enforcer/src/ScreenlyEnforcerModule";

function formatMinutes(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return getLocalDateString(dt);
}

export default function ScreenTimeTab() {
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [showCalendar, setShowCalendar] = useState(false);
  const [data, setData] = useState<AppUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUsagePerm, setHasUsagePerm] = useState(true);

  const today = getLocalDateString();
  const isToday = selectedDate === today;

  const activeDateRef = useRef(selectedDate);
  activeDateRef.current = selectedDate;

  const load = useCallback(async () => {
    const targetDate = selectedDate;
    setLoading(true);
    let perm = true;
    try {
      perm = await ScreenlyEnforcer.hasUsageStatsPermission();
    } catch {
      perm = true;
    }
    const result = await getScreenTimeData(targetDate);
    // If usage stats exist, permission is unequivocally granted
    if (result && result.length > 0) {
      perm = true;
    }
    setHasUsagePerm(perm);

    // Ignore stale response if user has selected another date in the meantime
    if (activeDateRef.current === targetDate) {
      setData(result);
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        load();
      }
    });
    return () => sub.remove();
  }, [load]);

  const openUsageSettings = useCallback(async () => {
    // Permission state is read from AppOps on the native side, never cached
    // locally. Setting it optimistically here made the banner disappear while
    // the enforcer still had no access; the AppState listener re-checks on
    // return to the app.
    setHasUsagePerm(false);
    try {
      await ScreenlyEnforcer.requestUsageStatsPermission();
      return;
    } catch {}
    try {
      if (Platform.OS === 'android') {
        await (Linking as any).sendIntent('android.settings.USAGE_ACCESS_SETTINGS');
        return;
      }
    } catch {}
    try {
      await Linking.openSettings();
    } catch {}
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const totalMinutes = data.reduce((s, a) => s + a.minutes, 0);

  return (
    <View className="flex-1 bg-background">
      {/* Calendar Popup Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable
          className="flex-1 bg-black/45 items-center justify-center p-4"
          onPress={() => setShowCalendar(false)}
        >
          <Pressable
            className="w-full max-w-sm rounded-2xl overflow-hidden bg-surface border border-border shadow-xl p-2"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between px-3 py-2 border-b border-border mb-1">
              <Text className="text-sm font-bold text-foreground">Choose Date</Text>
              <TouchableOpacity
                onPress={() => setShowCalendar(false)}
                className="p-1 rounded-lg"
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Calendar
              current={selectedDate}
              maxDate={today}
              markedDates={{ [selectedDate]: { selected: true, selectedColor: colors.primary } }}
              onDayPress={(d: any) => {
                setSelectedDate(d.dateString);
                setShowCalendar(false);
              }}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textMuted,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                indicatorColor: colors.primary,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <FlatList
        data={data}
        keyExtractor={(item) => item.packageName}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            {/* Width-fit compact date selector "< Today >" right above graph box */}
            <View className="flex-row items-center self-start bg-surface border border-border rounded-xl p-1 mb-2.5 gap-1 shadow-xs">
              <TouchableOpacity
                onPress={() => setSelectedDate((d) => shiftDate(d, -1))}
                className="p-1.5 rounded-lg bg-surface-alt active:opacity-70"
              >
                <Ionicons name="chevron-back" size={16} color={colors.text} />
              </TouchableOpacity>

              <Pressable
                onPress={() => setShowCalendar(true)}
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg active:bg-surface-alt"
              >
                <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                <Text className="text-xs font-semibold text-foreground">
                  {isToday ? "Today" : selectedDate}
                </Text>
              </Pressable>

              <TouchableOpacity
                onPress={() => setSelectedDate((d) => shiftDate(d, 1))}
                disabled={isToday}
                className={`p-1.5 rounded-lg bg-surface-alt active:opacity-70 ${isToday ? "opacity-30" : "opacity-100"}`}
              >
                <Ionicons name="chevron-forward" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Activity Graph */}
            <ScreenTimeGraph totalMinutes={totalMinutes} appsCount={data.length} isToday={isToday} />

            {/* Applications Header */}
            <View className="flex-row justify-between items-center mb-2 mt-2 px-1">
              <Text className="text-xs font-semibold tracking-wider text-muted-foreground">
                APPLICATIONS ({data.length})
              </Text>
              <Text className="text-xs text-muted-foreground">
                Total {formatMinutes(totalMinutes)}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !hasUsagePerm ? (
            <View className="py-12 items-center justify-center px-4">
              <Text className="text-center text-sm text-muted-foreground leading-5">
                Usage access is required to display your screen time stats.
              </Text>
              <TouchableOpacity
                className="mt-4 bg-primary px-5 py-2.5 rounded-xl active:opacity-80"
                onPress={openUsageSettings}
              >
                <Text className="text-white font-semibold">Enable Usage Access</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="py-12 items-center justify-center px-4">
              <Text className="text-center text-sm text-muted-foreground leading-5">
                No usage data for {isToday ? "today" : selectedDate}.
              </Text>
              <TouchableOpacity
                className="mt-4 bg-primary px-5 py-2.5 rounded-xl"
                onPress={load}
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          )
        }
          renderItem={({ item }) => {
            const percentage = totalMinutes > 0 ? ((item.minutes / totalMinutes) * 100).toFixed(1) : "0.0";
            const progressRatio = totalMinutes > 0 ? Math.min(1, Math.max(0.04, item.minutes / totalMinutes)) : 0;

            const iconUri = item.iconBase64
              ? (item.iconBase64.startsWith("data:") ? item.iconBase64 : `data:image/png;base64,${item.iconBase64}`)
              : null;
            const initial = (item.appName?.trim()?.[0] || item.packageName?.split(".").pop()?.[0] || "A").toUpperCase();

            return (
              <View className="flex-row items-center py-2.5 px-1 gap-3.5 border-b border-border/40">
                {/* App Icon */}
                {iconUri ? (
                  <Image
                    source={{ uri: iconUri }}
                    className="w-10 h-10 rounded-xl"
                  />
                ) : (
                  <View className="w-10 h-10 rounded-xl bg-primary-light border border-border items-center justify-center">
                    <Text className="text-base font-bold text-primary">
                      {initial}
                    </Text>
                  </View>
                )}

                {/* Name & Progress Bar */}
                <View className="flex-1 justify-center">
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                    {item.appName}
                  </Text>
                  <View className="h-1.5 rounded-full bg-surface-alt mt-1.5 overflow-hidden w-full">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round(progressRatio * 100)}%` }}
                    />
                  </View>
                </View>

                {/* Right: Time & Percentage */}
                <View className="items-end justify-center">
                  <Text className="text-sm font-bold text-foreground">
                    {formatMinutes(item.minutes)}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {percentage}%
                  </Text>
                </View>
              </View>
            );
          }}
        />
    </View>
  );
}



