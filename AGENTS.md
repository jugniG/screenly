# Screenly — Build & Development

## Build Release APK

```bash
# From packages/mobile/
export JAVA_HOME="B:/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="C:/Users/gjugn/AppData/Local/Android/Sdk"

cd android
./gradlew assembleRelease
```

APK output: `android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`

## Debug APK (for dev with Metro hot reload)

```bash
# Same env vars, then:
cd android
./gradlew assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk`

Run Metro: `bun start --clear` (from `packages/mobile/`)

## Important Notes

- **Build timeout**: the Gradle build can take 5-10+ minutes and often times out in the agent shell. Run builds manually in a terminal.
- **DO NOT let the agent run the build** — it times out and wastes time. Always run it yourself.
- **JS bundle is embedded**: release APK includes all JS — no Metro needed for end users.
- **arm64-only**: ABI splits configured to only build for `arm64-v8a` (modern Android phones).
- **No expo-dev-client**: removed from project. Release APK launches directly into the app.
- **platform**: Android only (no iOS — requires Mac).

## Distribution

Upload `app-arm64-v8a-release.apk` to Firebase App Distribution for sharing.
