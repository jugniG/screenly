package expo.modules.screenlyenforcer

import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.util.Log

data class AppUsage(
  val packageName: String,
  val appName: String,
  val totalMinutes: Int,
)

class UsageTracker(context: Context) {
  private val pm = context.packageManager
  private val prefs: SharedPreferences = context.getSharedPreferences("screenly_usage_tracker", Context.MODE_PRIVATE)
  private val usm: UsageStatsManager? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP)
      context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
    else null

  // ── Helpers ──────────────────────────────────────────────────────────────

  private fun todayStartMs(): Long {
    val cal = java.util.Calendar.getInstance()
    cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
    cal.set(java.util.Calendar.MINUTE, 0)
    cal.set(java.util.Calendar.SECOND, 0)
    cal.set(java.util.Calendar.MILLISECOND, 0)
    return cal.timeInMillis
  }

  // ── Real-time session tracking (called by EnforcerAccessibilityService) ──

  /** Called when a new app comes to foreground. Tracks the current foreground for live top-up. */
  fun recordForeground(packageName: String, nowMs: Long) {
    Log.i("UsageTracker", "[TRACK] fg -> $packageName")
    prefs.edit()
      .putString("fg_pkg", packageName)
      .putLong("fg_start", nowMs)
      .apply()
  }

  /** Called when Screenly itself comes to foreground — stops the running timer. */
  fun pauseTracking(nowMs: Long) {
    Log.i("UsageTracker", "[TRACK] pause — clearing foreground tracking")
    prefs.edit().remove("fg_pkg").remove("fg_start").apply()
  }

  // ── OS-level usage query (accurate, used for UI display) ─────────────────

  /**
   * Queries the Android OS UsageStatsManager for today's aggregated foreground
   * time per package. This matches what Digital Wellbeing reports and is always
   * accurate regardless of when the Accessibility Service started.
   *
   * Returns null if the API is unavailable (pre-Lollipop or no permission).
   */
  private fun queryOsUsageMs(): Map<String, Long>? {
    val manager = usm ?: run {
      Log.w("UsageTracker", "[USAGE] usm is null — UsageStatsManager unavailable")
      return null
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      Log.w("UsageTracker", "[USAGE] SDK < Lollipop, skipping queryUsageStats")
      return null
    }

    return try {
      val now = System.currentTimeMillis()
      val dayStart = todayStartMs()
      Log.i("UsageTracker", "[USAGE] queryUsageStats dayStart=$dayStart now=$now range=${now - dayStart}ms")

      val stats = manager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, dayStart, now)
      Log.i("UsageTracker", "[USAGE] queryUsageStats returned ${stats?.size ?: "null"} entries")

      if (stats.isNullOrEmpty()) {
        Log.w("UsageTracker", "[USAGE] empty result — permission missing or no usage today")
        return emptyMap()
      }

      // queryUsageStats with INTERVAL_DAILY can return multiple entries per package
      // (e.g. spanning bucket boundaries) — fold them together.
      val result = mutableMapOf<String, Long>()
      for (stat in stats) {
        if (stat.totalTimeInForeground > 0) {
          result[stat.packageName] = (result[stat.packageName] ?: 0L) + stat.totalTimeInForeground
        }
      }
      Log.i("UsageTracker", "[USAGE] ${result.size} packages with foreground time")
      result.entries
        .sortedByDescending { it.value }
        .take(10)
        .forEach { Log.i("UsageTracker", "[USAGE]   ${it.key} = ${it.value / 60000}min (${it.value}ms)") }
      result
    } catch (ex: Exception) {
      Log.e("UsageTracker", "[USAGE] queryUsageStats exception: ${ex.message}")
      null
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Returns today's usage for all tracked apps.
   *
   * Source: Android OS UsageStatsManager (accurate, matches Digital Wellbeing).
   */
  fun getTodayUsage(): List<AppUsage> {
    Log.i("UsageTracker", "[USAGE] getTodayUsage() called")
    val osUsage = queryOsUsageMs()

    if (osUsage == null) {
      Log.w("UsageTracker", "[USAGE] OS data unavailable, returning empty")
      return emptyList()
    }

    Log.i("UsageTracker", "[USAGE] using OS data path (${osUsage.size} packages)")
    val fgPkg = prefs.getString("fg_pkg", null)
    val fgStart = prefs.getLong("fg_start", 0)
    val usageMs = if (fgPkg != null && fgStart > 0) {
      val running = System.currentTimeMillis() - fgStart
      if (running > 0) {
        val mutable = osUsage.toMutableMap()
        mutable[fgPkg] = (osUsage[fgPkg] ?: 0L) + running
        Log.i("UsageTracker", "[USAGE] live session top-up: $fgPkg +${running / 60000}min (running ${running}ms)")
        mutable
      } else osUsage
    } else {
      Log.i("UsageTracker", "[USAGE] no live session in prefs (fg_pkg=null)")
      osUsage
    }

    val result = usageMs
      .filter { it.value > 0 }
      .mapNotNull { (pkg, ms) ->
        val name = try {
          val appInfo = pm.getApplicationInfo(pkg, 0)
          pm.getApplicationLabel(appInfo).toString()
        } catch (_: Exception) {
          pkg
        }
        AppUsage(
          packageName = pkg,
          appName = name,
          totalMinutes = (ms / 60000).toInt().coerceAtLeast(0),
        )
      }
      .sortedByDescending { it.totalMinutes }

    Log.i("UsageTracker", "[USAGE] returning ${result.size} AppUsage entries")
    return result
  }

  /**
   * Returns today's total foreground minutes for a specific package.
   *
   * Uses the OS UsageStatsManager as the authoritative baseline (same source as
   * Digital Wellbeing), then adds the currently-running live session on top to
   * compensate for the ~1 minute OS query lag.
   */
  fun getTodayMinutesForPackage(packageName: String): Int {
    val osMs = queryOsUsageMs()?.get(packageName) ?: 0L

    // Add live running time if this app is currently active
    val fgPkg = prefs.getString("fg_pkg", null)
    val fgStart = prefs.getLong("fg_start", 0)
    val liveMs = if (packageName == fgPkg && fgStart > 0)
      (System.currentTimeMillis() - fgStart).coerceAtLeast(0L) else 0L

    val totalMs = osMs + liveMs
    Log.i("UsageTracker", "[ENFORCE] $packageName — osMs=${osMs/60000}min live=${liveMs/60000}min total=${totalMs/60000}min")
    return (totalMs / 60000).toInt().coerceAtLeast(0)
  }

  /** Clears foreground tracking state. */
  fun resetDaily() {
    prefs.edit().remove("fg_pkg").remove("fg_start").apply()
  }
}
