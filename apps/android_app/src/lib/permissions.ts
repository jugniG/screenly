import ScreenlyEnforcer from '@/modules/screenly-enforcer/src/ScreenlyEnforcerModule'

/**
 * Both permissions are required: usage stats to measure screen time and the
 * accessibility service to block the app. If either is missing the enforcer
 * silently does nothing.
 *
 * This is the authoritative check and is never cached. Android revokes
 * accessibility on app update, and users revoke either one from Settings at any
 * time; a stored "already granted" flag would leave the app looking healthy
 * while it blocks nothing.
 *
 * Failures resolve to `true` deliberately. A runtime without the native module
 * (Expo Go) can never grant these, and looping the user to a setup screen they
 * cannot pass is worse than letting them continue.
 */
export async function hasRequiredPermissions(): Promise<boolean> {
  try {
    const [usage, accessibility] = await Promise.all([
      ScreenlyEnforcer.hasUsageStatsPermission(),
      ScreenlyEnforcer.isAccessibilityServiceEnabled(),
    ])
    return Boolean(usage && accessibility)
  } catch {
    return true
  }
}

/** Individual permission state, so the UI can name what is actually missing. */
export async function permissionState(): Promise<{
  usageStats: boolean
  accessibility: boolean
}> {
  try {
    const [usage, accessibility] = await Promise.all([
      ScreenlyEnforcer.hasUsageStatsPermission(),
      ScreenlyEnforcer.isAccessibilityServiceEnabled(),
    ])
    return { usageStats: Boolean(usage), accessibility: Boolean(accessibility) }
  } catch {
    return { usageStats: true, accessibility: true }
  }
}

/**
 * True when setup still has to run. Used after authentication to route the user
 * to /setup instead of the tabs, and on resume to catch permissions revoked
 * outside the app.
 */
export async function needsPermissionSetup(): Promise<boolean> {
  return !(await hasRequiredPermissions())
}

/**
 * Called after authentication. Returns true when the user still has to complete
 * the permission flow, so the caller can send them to /setup instead of the tabs.
 */
export async function routeAfterAuth(): Promise<boolean> {
  return await needsPermissionSetup()
}