import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "./database";
import * as schema from "./database/schema";
const  baseURL= process.env.WEBSITE_URL
console.log({baseURL});

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

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "placeholder",
      disableStateCheck: true,
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Lazy-import Resend so missing key doesn't crash at startup
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const res = await resend.emails.send({
          from: "screenly@syncmate.xyz",
          to: email,
          subject: "Your Screenly sign-in link",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
              <h2 style="color:#6C63FF">Sign in to Screenly</h2>
              <p>Click below to sign in. This link expires in 10 minutes.</p>
              <a href="${url}" style="display:inline-block;background:#6C63FF;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Sign in to Screenly
              </a>
              <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
            </div>
          `,
        });
        console.log({res});
        
      },
    }),
  ],
});
