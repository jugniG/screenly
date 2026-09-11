import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  "http://10.0.2.2:3000";

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
  plugins: [
    emailOTPClient(),
    expoClient({
      scheme: "screenly",
      storagePrefix: "screenly",
      storage: SecureStore,
    }),
  ],
  fetchOptions: {
    headers: {
      Origin: baseURL,
    },
  },
});
