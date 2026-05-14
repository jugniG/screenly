// Points to the Hono API server
// In development, use your machine's local IP (not localhost — emulator can't reach it)
// In production, set this to your deployed API URL
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000';
