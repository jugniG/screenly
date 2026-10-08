import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { createORPCClient } from "@orpc/client";
import { RPCLink } from '@orpc/client/fetch';
import type { AppRouter } from '@screen/api/router-types';

const BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://10.0.2.2:3000';

/**
 * The Expo auth plugin stores cookies in SecureStore as a JSON map of
 * `{ [cookieName]: { value, expires } }`, not as a Cookie header string. Sending
 * that JSON straight through makes the server see no session at all, so it has
 * to be flattened into `name=value; name=value` first — expired entries
 * dropped.
 */
function toCookieHeader(stored: string | null): string | null {
  if (!stored) return null;

  let parsed: Record<string, { value?: string; expires?: string | null }>;
  try {
    parsed = JSON.parse(stored);
  } catch {
    // Older builds stored a raw header string; pass it through unchanged.
    return stored || null;
  }

  const now = Date.now();
  return Object.entries(parsed)
    .filter(([, c]) => !c?.expires || new Date(c.expires).getTime() > now)
    .map(([name, c]) => `${name}=${c?.value ?? ''}`)
    .join('; ');
}

const link = new RPCLink({
  url: `${BASE_URL}/api/rpc`,
  headers: async () => {
    try {
      const cookie = toCookieHeader(await SecureStore.getItemAsync('screenly_cookie'));
      return cookie ? { Cookie: cookie } : {};
    } catch {
      return {};
    }
  },
})

export const orpcClient = createORPCClient<AppRouter>(link)

/** @deprecated Use `orpcClient.procedureName(input)` directly — it's fully typed via `AppRouter` */
export async function orpc<TInput = Record<string, unknown>, TOutput = unknown>(
  procedure: string,
  input?: TInput,
): Promise<TOutput> {
  return (orpcClient as any)[procedure](input ?? {}) as Promise<TOutput>;
}
