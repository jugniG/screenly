package expo.modules.screenlyenforcer

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ScreenlyEnforcerModule : Module() {
  private lateinit var ruleStore: RuleStore
  private lateinit var unlockStore: UnlockStore
  private lateinit var usageTracker: UsageTracker

  override fun definition() = ModuleDefinition {
    Name("ScreenlyEnforcer")

    OnCreate {
      val ctx = appContext.reactContext ?: return@OnCreate
      ruleStore = RuleStore(ctx)
      unlockStore = UnlockStore(ctx)
      usageTracker = UsageTracker(ctx)
    }

    Function("getInstalledApps") {
      val pm = appContext.reactContext?.packageManager
        ?: throw Exception("PackageManager not available")

      val intent = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }

      val activities = pm.queryIntentActivities(intent, 0)
      activities
        .map { resolveInfo ->
          mapOf(
            "appName" to resolveInfo.loadLabel(pm).toString(),
            "packageName" to resolveInfo.activityInfo.packageName
          )
        }
        .distinctBy { it["packageName"] }
    }

    Function("getForegroundApp") {
      val context = appContext.reactContext ?: throw Exception("Context not available")

      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
        return@Function null
      }

      val usm = context.getSystemService(android.content.Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
      val end = System.currentTimeMillis()
      val start = end - 10_000

      val events = usm.queryEvents(start, end)
      var lastForeground: String? = null

      val event = android.app.usage.UsageEvents.Event()
      while (events.hasNextEvent()) {
        events.getNextEvent(event)
        if (event.eventType == android.app.usage.UsageEvents.Event.MOVE_TO_FOREGROUND) {
          lastForeground = event.packageName
        }
      }
      lastForeground
    }

    // --- Permissions ---

    Function("hasUsageStatsPermission") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
        return@Function true
      }
      val context = appContext.reactContext ?: return@Function false
      val appOps = context.getSystemService(android.content.Context.APP_OPS_SERVICE) as android.app.AppOpsManager
      val mode = appOps.checkOpNoThrow(
        android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
        android.os.Process.myUid(),
        context.packageName
      )
      return@Function mode == android.app.AppOpsManager.MODE_ALLOWED
    }

    Function("requestUsageStatsPermission") {
      val context = appContext.reactContext ?: throw Exception("Context not available")
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    // --- Enforcement ---

    Function("updateRules") { rulesJson: String ->
      if (this@ScreenlyEnforcerModule::ruleStore.isInitialized) {
        ruleStore.updateRules(rulesJson)
      }
    }

    Function("unlockApp") { packageName: String ->
      if (this@ScreenlyEnforcerModule::unlockStore.isInitialized) {
        unlockStore.unlockUntilMidnight(packageName)
      }
    }

    Function("isAppUnlocked") { packageName: String ->
      if (this@ScreenlyEnforcerModule::unlockStore.isInitialized) {
        return@Function unlockStore.isUnlocked(packageName)
      }
      return@Function false
    }

    Function("getTodayUsage") {
      Log.i("ScreenlyEnforcer", "getTodayUsage called")
      val ctx = appContext.reactContext
      if (ctx == null) {
        Log.w("ScreenlyEnforcer", "getTodayUsage: reactContext is null, returning empty")
        return@Function emptyList<Map<String, Any>>()
      }
      if (!this@ScreenlyEnforcerModule::usageTracker.isInitialized) {
        Log.i("ScreenlyEnforcer", "getTodayUsage: initializing usageTracker")
        usageTracker = UsageTracker(ctx)
      }
      Log.i("ScreenlyEnforcer", "getTodayUsage: calling usageTracker.getTodayUsage()")
      val result = usageTracker.getTodayUsage()
      Log.i("ScreenlyEnforcer", "getTodayUsage: got ${result.size} entries")
      return@Function result.map { usage ->
        mapOf(
          "packageName" to usage.packageName,
          "appName" to usage.appName,
          "totalMinutes" to usage.totalMinutes,
        )
      }
    }

    Function("isAccessibilityServiceEnabled") {
      val context = appContext.reactContext ?: return@Function false
      val serviceName = "${context.packageName}/expo.modules.screenlyenforcer.EnforcerAccessibilityService"
      val enabledServices = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
      ) ?: ""
      return@Function enabledServices.contains(serviceName)
    }

    Function("requestAccessibilityService") {
      val context = appContext.reactContext ?: throw Exception("Context not available")
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    // --- App Icons ---

    Function("getAppIcons") { packageNamesJson: String ->
      val context = appContext.reactContext ?: return@Function "{}"
      val pm = context.packageManager
      val names = org.json.JSONArray(packageNamesJson)
      val result = org.json.JSONObject()

      for (i in 0 until names.length()) {
        val pkg = names.getString(i)
        try {
          val info = pm.getApplicationInfo(pkg, 0)
          val drawable = pm.getApplicationIcon(info)
          val w = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
          val h = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
          val bitmap = android.graphics.Bitmap.createBitmap(w, h, android.graphics.Bitmap.Config.ARGB_8888)
          val canvas = android.graphics.Canvas(bitmap)
          drawable.setBounds(0, 0, canvas.width, canvas.height)
          drawable.draw(canvas)
          val stream = java.io.ByteArrayOutputStream()
          bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, stream)
          val bytes = stream.toByteArray()
          val base64 = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
          result.put(pkg, "data:image/png;base64,$base64")
        } catch (_: Exception) {
          // skip apps that can't be resolved
        }
      }

      result.toString()
    }
  }
}
