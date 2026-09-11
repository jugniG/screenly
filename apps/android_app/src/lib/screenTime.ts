import ScreenlyEnforcer from '../modules/screenly-enforcer/src/ScreenlyEnforcerModule'

export type AppUsage = { packageName: string; appName: string; minutes: number; iconBase64?: string | null }

export async function getScreenTimeData(): Promise<AppUsage[]> {
  try {
    const raw = await ScreenlyEnforcer.getTodayUsage()
    const parsed: { packageName: string; totalMinutes: number; appName?: string }[] = Array.isArray(raw) ? raw : JSON.parse(raw as unknown as string)
    if (!Array.isArray(parsed) || parsed.length === 0) return []

    const packageNames = parsed.map((p) => p.packageName)
    let icons: Record<string, string> = {}
    try {
      const iconsJson = await ScreenlyEnforcer.getAppIcons(JSON.stringify(packageNames))
      icons = JSON.parse(iconsJson)
    } catch {}

    // Need appName mapping - use packageName as fallback, try to get from icons keys or keep as package
    const result: AppUsage[] = parsed
      .map((p) => ({
        packageName: p.packageName,
        appName: p.packageName.split('.').pop() ?? p.packageName,
        minutes: p.totalMinutes,
        iconBase64: icons[p.packageName] ?? null,
      }))
      .sort((a, b) => b.minutes - a.minutes)

    return result
  } catch {
    return []
  }
}

export function getTopApps(data: AppUsage[], n = 3) {
  return data.slice(0, n).map((a) => ({ packageName: a.packageName, appName: a.appName, minutes: a.minutes }))
}

export function getTotalMinutes(data: AppUsage[]) {
  return data.reduce((s, a) => s + a.minutes, 0)
}
