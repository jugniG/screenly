import Constants from 'expo-constants';

const BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://10.0.2.2:3000';

export async function orpc<TInput = Record<string, unknown>, TOutput = unknown>(
  procedure: string,
  input?: TInput,
): Promise<TOutput> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${BASE_URL}/api/rpc/${procedure}`, {
      method: 'POST',
      signal: controller.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE_URL,
      },
      body: input !== undefined ? JSON.stringify(input) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message ?? `RPC failed: ${procedure}`);
    }

    return res.json() as Promise<TOutput>;
  } finally {
    clearTimeout(timeout);
  }
}
