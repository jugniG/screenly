import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import Constants from "expo-constants";

const baseURL =
  Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "";
console.log({baseURL});

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
  plugins: [magicLinkClient()],
  fetchOptions: {
    headers: {
      Origin: baseURL,
    },
  },
});
