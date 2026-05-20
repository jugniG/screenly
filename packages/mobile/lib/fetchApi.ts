import Constants from 'expo-constants';

const API_BASE: string =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://10.0.2.2:3000';

console.log('[fetchApi] apiUrl from config:', Constants.expoConfig?.extra?.apiUrl);
console.log('[fetchApi] EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('[fetchApi] resolved API_BASE:', API_BASE);

export { API_BASE };

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    return await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      credentials: 'include',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Origin: API_BASE,
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}
