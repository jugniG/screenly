import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import Constants from "expo-constants";

const baseURL =
  Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "";

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
