package expo.modules.screenlyenforcer

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.widget.Toast
import java.time.LocalTime

class EnforcerAccessibilityService : AccessibilityService() {
  private lateinit var ruleStore: RuleStore
  private lateinit var unlockStore: UnlockStore
  private lateinit var usageTracker: UsageTracker

  // Track the last package we saw come to foreground to deduplicate rapid events
  private var lastForegroundPackage: String? = null
  private val selfPackage: String by lazy { packageName }
  private val mainHandler = Handler(Looper.getMainLooper())

  private fun toast(msg: String) {
    Log.i("Enforcer", msg)
    mainHandler.post { Toast.makeText(this, "[Enforcer] $msg", Toast.LENGTH_SHORT).show() }
  }

  override fun onServiceConnected() {
    val info = AccessibilityServiceInfo().apply {
      eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
      feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
      notificationTimeout = 100
      flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
    }
    serviceInfo = info
    ruleStore = RuleStore(this)
    unlockStore = UnlockStore(this)
    usageTracker = UsageTracker(this)
    toast("Service connected")
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent) {
    if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

    val pkg = event.packageName?.toString() ?: return

    // Screenly came to foreground — pause tracking (stop the running timer)
    if (pkg == selfPackage) {
      usageTracker.pauseTracking(System.currentTimeMillis())
      return
    }

    // Deduplicate: same package firing multiple events in a row
    if (pkg == lastForegroundPackage) return
    lastForegroundPackage = pkg

    // Real-time usage tracking — record the transition
    usageTracker.recordForeground(pkg, System.currentTimeMillis())

    Log.i("Enforcer", "Foreground: $pkg")

    // Check unlock first (cheapest check)
    if (unlockStore.isUnlocked(pkg)) {
      Log.i("Enforcer", "  -> unlocked, skipping")
      return
    }

    val rule = ruleStore.getRuleForPackage(pkg)
    if (rule == null) {
      Log.i("Enforcer", "  -> no rule")
      return
    }

    if (shouldBlock(rule, pkg)) {
      toast("BLOCKING $pkg (${rule.ruleType})")
      launchBlockScreen(rule.packageName, rule.appName)
    } else {
      Log.i("Enforcer", "  -> rule found but not blocking (${rule.ruleType})")
    }
  }

  private fun shouldBlock(rule: AppRule, packageName: String): Boolean {
    return when (rule.ruleType) {
      "daily_limit" -> {
        val limitMin = rule.limitMinutes ?: return false
        val used = if (rule.period == "hourly")
          usageTracker.getCurrentHourMinutesForPackage(packageName)
        else
          usageTracker.getTodayMinutesForPackage(packageName)
        val periodLabel = if (rule.period == "hourly") "hour" else "day"
        toast("daily_limit($periodLabel): used=${used}m limit=${limitMin}m block=${used >= limitMin}")
        used >= limitMin
      }
      "schedule" -> {
        val start = rule.scheduleStart ?: return false
        val end = rule.scheduleEnd ?: return false
        try {
          val now = LocalTime.now()
          val s = LocalTime.parse(start)
          val e = LocalTime.parse(end)
          // Allow window: if now is inside the window, do NOT block
          val inWindow = if (s <= e) !now.isBefore(s) && now.isBefore(e)
                         else !now.isBefore(s) || now.isBefore(e)
          toast("schedule: inWindow=$inWindow block=${!inWindow}")
          !inWindow  // block when OUTSIDE the allowed window
        } catch (ex: Exception) {
          Log.w("Enforcer", "  schedule parse error: ${ex.message}")
          false
        }
      }
      "block_always" -> true
      else -> false
    }
  }

  private fun launchBlockScreen(packageName: String, appName: String) {
    try {
      val intent = Intent(
        Intent.ACTION_VIEW,
        Uri.parse("screenly://block?packageName=$packageName&appName=${Uri.encode(appName)}")
      ).apply {
        addFlags(
          Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP
        )
      }
      startActivity(intent)
      // Reset foreground tracking so next time user opens this app we block again
      lastForegroundPackage = null
      Log.i("Enforcer", "  block screen launched for $packageName")
    } catch (e: Exception) {
      Log.e("Enforcer", "  failed to launch block screen: ${e.message}")
    }
  }

  override fun onInterrupt() {}
}
