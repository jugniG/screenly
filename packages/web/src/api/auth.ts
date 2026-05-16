import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "./database";
import * as schema from "./database/schema";

const baseURL = process.env.WEBSITE_URL

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: ["*"],

  account: {
    skipStateCookieCheck: true,
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      sendVerificationOTP: async ({ email, otp, type }) => {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "screenly@syncmate.xyz",
          to: email,
          subject: "Your Screenly sign-in code",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
              <h2 style="color:#6C63FF">Sign in to Screenly</h2>
              <p>Your one-time code is:</p>
              <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#6C63FF;text-align:center;padding:24px;background:#f5f3ff;border-radius:12px;margin:16px 0">
                ${otp}
              </div>
              <p style="color:#888;font-size:12px">This code expires in 5 minutes.</p>
            </div>
          `,
        });
      },
    }),
  ],
});
