export interface AppInfo {
  appName: string;
  packageName: string;
}

export interface AppUsage {
  packageName: string;
  appName: string;
  totalMinutes: number;
}

export interface ScreenlyEnforcerModule {
  getInstalledApps(): Promise<AppInfo[]>;
  getForegroundApp(): Promise<string | null>;
  hasUsageStatsPermission(): Promise<boolean>;
  requestUsageStatsPermission(): Promise<void>;
  hasOverlayPermission(): Promise<boolean>;
  requestOverlayPermission(): Promise<void>;

  // Enforcement
  updateRules(rulesJson: string): Promise<void>;
  unlockApp(packageName: string): Promise<void>;
  unlockAppForMinutes(packageName: string, minutes: number): Promise<void>;
  isAppUnlocked(packageName: string): Promise<boolean>;
  getTodayUsage(): Promise<AppUsage[]>;
  isAccessibilityServiceEnabled(): Promise<boolean>;
  requestAccessibilityService(): Promise<void>;
}
