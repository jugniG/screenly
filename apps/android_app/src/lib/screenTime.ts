import ScreenlyEnforcer from '../modules/screenly-enforcer/src/ScreenlyEnforcerModule'

export type AppUsage = {
  packageName: string
  appName: string
  minutes: number
  iconBase64?: string | null
}

const KNOWN_APP_NAMES: Record<string, string> = {
  'com.google.android.youtube': 'YouTube',
  'com.android.chrome': 'Chrome',
  'com.screenly.app': 'Screenly',
  'com.whatsapp': 'WhatsApp',
  'com.google.android.dialer': 'Phone',
  'com.android.dialer': 'Phone',
  'com.android.vending': 'Play Store',
  'com.google.android.deskclock': 'Clock',
  'com.android.deskclock': 'Clock',
  'com.instagram.android': 'Instagram',
  'com.twitter.android': 'X',
  'com.zhiliaoapp.musically': 'TikTok',
  'com.spotify.music': 'Spotify',
  'com.netflix.mediaclient': 'Netflix',
}

function formatAppName(pkg: string, nativeName?: string): string {
  if (nativeName && nativeName.trim() && nativeName !== pkg) {
    return nativeName
  }
  if (KNOWN_APP_NAMES[pkg]) {
    return KNOWN_APP_NAMES[pkg]
  }
  const last = pkg.split('.').pop() ?? pkg
  return last.charAt(0).toUpperCase() + last.slice(1)
}


export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getScreenTimeData(selectedDate?: string): Promise<AppUsage[]> {
  try {
    const today = getLocalDateString()
    const isToday = !selectedDate || selectedDate === today

    let raw: any
    if (isToday) {
      raw = typeof ScreenlyEnforcer.queryUsageStats === 'function'
        ? await ScreenlyEnforcer.queryUsageStats(4, new Date().setHours(0, 0, 0, 0), Date.now())
        : await ScreenlyEnforcer.getTodayUsage()
    } else {
      if (typeof ScreenlyEnforcer.queryUsageStats !== 'function') {
        // Native binary does not support range queries yet (stale build); return empty rather than showing today's numbers
        return []
      }

      const [year, month, day] = selectedDate.split("-").map(Number)
      const startMs = new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
      const endMs = new Date(year, month - 1, day, 23, 59, 59, 999).getTime()

      // 0 = UsageStatsManager.INTERVAL_DAILY (prevents combining entire week into single day)
      raw = await ScreenlyEnforcer.queryUsageStats(0, startMs, endMs)
    }

    const parsed: { packageName: string; totalMinutes: number; appName?: string }[] = Array.isArray(raw) ? raw : JSON.parse(raw as unknown as string);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];

    const packageNames = parsed.map((p) => p.packageName);
    let icons: Record<string, string> = {};
    try {
      const iconsJson = await ScreenlyEnforcer.getAppIcons(JSON.stringify(packageNames));
      icons = JSON.parse(iconsJson);
    } catch {}

    const result: AppUsage[] = parsed
      .map((p) => ({
        packageName: p.packageName,
        appName: formatAppName(p.packageName, p.appName),
        minutes: p.totalMinutes,
        iconBase64: icons[p.packageName] ?? null,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    return result;
  } catch {
    return [];
  }
}

export function getTopApps(data: AppUsage[], n = 3) {
  return data.slice(0, n).map((a) => ({ packageName: a.packageName, appName: a.appName, minutes: a.minutes }))
}

export function getTotalMinutes(data: AppUsage[]) {
  return data.reduce((s, a) => s + a.minutes, 0)
}

