import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import Constants from "expo-constants";

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  "http://10.0.2.2:3000";

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
  plugins: [emailOTPClient()],
  fetchOptions: {
    headers: {
      Origin: baseURL,
    },
  },
});
