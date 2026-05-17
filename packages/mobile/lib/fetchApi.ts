import Constants from 'expo-constants';

const API_BASE: string =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://10.0.2.2:3000';

console.log('[fetchApi] apiUrl from config:', Constants.expoConfig?.extra?.apiUrl);
console.log('[fetchApi] EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('[fetchApi] resolved API_BASE:', API_BASE);

export { API_BASE };

/**
 * Wrapper around fetch that always attaches the Origin header.
 * React Native does not set Origin automatically (unlike browsers),
 * which causes better-auth to reject requests with MISSING_OR_NULL_ORIGIN (403).
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Origin: API_BASE,
      ...(init?.headers ?? {}),
    },
  });
}
