package expo.modules.screenlyenforcer

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

data class AppRule(
  val id: String,
  val packageName: String,
  val appName: String,
  val ruleType: String,
  val limitMinutes: Int?,
  val scheduleStart: String?,
  val scheduleEnd: String?,
  val enabled: Boolean,
)

class RuleStore(context: Context) {
  private val prefs: SharedPreferences =
    context.getSharedPreferences("screenly_rules", Context.MODE_PRIVATE)

  fun updateRules(rulesJson: String) {
    prefs.edit().putString("rules", rulesJson).apply()
  }

  fun getRuleForPackage(packageName: String): AppRule? {
    val json = prefs.getString("rules", null) ?: return null
    val arr = JSONArray(json)
    for (i in 0 until arr.length()) {
      val obj = arr.getJSONObject(i)
      if (obj.optString("packageName") == packageName && obj.optBoolean("enabled", true)) {
        return AppRule(
          id = obj.optString("id"),
          packageName = obj.optString("packageName"),
          appName = obj.optString("appName"),
          ruleType = obj.optString("ruleType"),
          limitMinutes = if (obj.has("limitMinutes") && !obj.isNull("limitMinutes")) obj.optInt("limitMinutes") else null,
          scheduleStart = obj.optString("scheduleStart", null),
          scheduleEnd = obj.optString("scheduleEnd", null),
          enabled = obj.optBoolean("enabled", true),
        )
      }
    }
    return null
  }
}
