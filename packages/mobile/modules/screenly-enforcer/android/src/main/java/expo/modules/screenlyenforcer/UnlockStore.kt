package expo.modules.screenlyenforcer

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

class UnlockStore(context: Context) {
  private val prefs: SharedPreferences =
    context.getSharedPreferences("screenly_unlocks", Context.MODE_PRIVATE)

  /** Unlock until 23:59:59 today — resets at midnight. */
  fun unlockUntilMidnight(packageName: String) {
    val cal = Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, 23)
      set(Calendar.MINUTE, 59)
      set(Calendar.SECOND, 59)
      set(Calendar.MILLISECOND, 999)
    }
    saveUnlock(packageName, cal.timeInMillis)
  }

  /** Legacy: unlock for a fixed number of minutes. */
  fun unlock(packageName: String, durationMinutes: Int) {
    val expiresAt = System.currentTimeMillis() + durationMinutes * 60_000L
    saveUnlock(packageName, expiresAt)
  }

  private fun saveUnlock(packageName: String, expiresAt: Long) {
    val json = prefs.getString("unlocks", "[]") ?: "[]"
    val arr = JSONArray(json)

    var found = false
    for (i in 0 until arr.length()) {
      val obj = arr.getJSONObject(i)
      if (obj.optString("packageName") == packageName) {
        obj.put("expiresAt", expiresAt)
        found = true
        break
      }
    }
    if (!found) {
      arr.put(JSONObject().apply {
        put("packageName", packageName)
        put("expiresAt", expiresAt)
      })
    }

    prefs.edit().putString("unlocks", arr.toString()).apply()
  }

  fun isUnlocked(packageName: String): Boolean {
    clearExpired()
    val json = prefs.getString("unlocks", "[]") ?: "[]"
    val arr = JSONArray(json)
    val now = System.currentTimeMillis()
    for (i in 0 until arr.length()) {
      val obj = arr.getJSONObject(i)
      if (obj.optString("packageName") == packageName) {
        return obj.optLong("expiresAt", 0) > now
      }
    }
    return false
  }

  private fun clearExpired() {
    val json = prefs.getString("unlocks", "[]") ?: "[]"
    val arr = JSONArray(json)
    val now = System.currentTimeMillis()
    val kept = JSONArray()
    for (i in 0 until arr.length()) {
      val obj = arr.getJSONObject(i)
      if (obj.optLong("expiresAt", 0) > now) {
        kept.put(obj)
      }
    }
    prefs.edit().putString("unlocks", kept.toString()).apply()
  }
}
