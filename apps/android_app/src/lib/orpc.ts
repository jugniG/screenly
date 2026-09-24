import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { createORPCClient } from "@orpc/client";
import { RPCLink } from '@orpc/client/fetch';
import type { AppRouter } from '@screen/api/router-types';

const BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://10.0.2.2:3000';

const link = new RPCLink({
  url: `${BASE_URL}/api/rpc`,
  headers: async () => {
    try {
      const cookie = await SecureStore.getItemAsync('screenly_cookie');
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
