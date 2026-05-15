import Constants from 'expo-constants';

const API_BASE: string =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://10.0.2.2:3000';

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
