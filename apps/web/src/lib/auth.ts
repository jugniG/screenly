import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, magicLink } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@screen/db";
import * as schema from "@screen/db/schema";
import { eq } from "drizzle-orm";
import { addEmailToGooglePlayTesters } from "./google-play";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  logger:{level:'debug'},
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: ["*", "screenly://", "exp://"],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user?.email) {
            void addEmailToGooglePlayTesters(user.email);
          }
        },
      },
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  plugins: [
    expo(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          const { error } = await resend.emails.send({
            from: "auth@chatcash.live",
            to: email,
            subject: "Sign in to Screenly",
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
                <h2 style="color:#e16540">Sign in to Screenly</h2>
                <p style="color:#333;font-size:15px;line-height:1.5">Click the link below to sign in to your Screenly account:</p>
                <div style="margin:28px 0;text-align:center">
                  <a href="${url}" style="background:#e16540;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;font-size:15px">
                    Sign In to Screenly
                  </a>
                </div>
                <p style="color:#888;font-size:12px">If you didn't request this email, you can safely ignore it. This link will expire soon.</p>
              </div>
            `,
          });

          if (error) {
            console.error("Resend API error:", error);
            throw new Error(`Resend failed: ${error.name} - ${error.message}`);
          }
        } catch (err) {
          console.error("Failed to send magic link via Resend:", err);
          throw err instanceof Error ? err : new Error("Failed to send magic link email");
        }
      },
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      sendVerificationOTP: async ({ email, otp }) => {
        const reviewerEmail = process.env.REVIEWER_EMAIL

        // If it's the reviewer account, force fixed OTP '123456' in database with long expiry
        if (reviewerEmail && email === reviewerEmail) {
          try {
            const result = await db
              .update(schema.verification)
              .set({
                value: "123456:0",
                expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years
              })
              .where(eq(schema.verification.identifier, `sign-in-otp-${reviewerEmail}`));
              console.error(JSON.stringify({result}));
              
          } catch (e) {
            console.error("Failed to set static reviewer OTP:", e);
          }
          return; // Skip sending email via Resend
        }

        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          const { error } = await resend.emails.send({
            from: "auth@chatcash.live",
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

          if (error) {
            console.error("Resend API error:", error);
            throw new Error(`Resend failed: ${error.name} - ${error.message}`);
          }
        } catch (err) {
          console.error("Failed to send verification OTP via Resend:", err);
          throw err instanceof Error ? err : new Error("Failed to send verification email");
        }
      },
    }),
    tanstackStartCookies(),
  ],
});
