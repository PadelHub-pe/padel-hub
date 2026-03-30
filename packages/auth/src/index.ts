import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins";

import { db } from "@wifo/db/client";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;
  extraPlugins?: TExtraPlugins;
  onSendResetPassword?: (params: {
    email: string;
    url: string;
  }) => Promise<void>;
}) {
  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    session: {
      expiresIn: 60 * 60 * 24, // 24 hours
      updateAge: 60 * 60, // refresh every hour
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      sendResetPassword: async ({
        user: resetUser,
        url,
      }: {
        user: { email: string };
        url: string;
      }) => {
        if (options.onSendResetPassword) {
          await options.onSendResetPassword({
            email: resetUser.email,
            url,
          });
        } else {
          console.log(
            `[AUTH] Password reset requested for ${resetUser.email} (no sender configured)`,
          );
        }
      },
    },
    socialProviders: {
      // eslint-disable-next-line no-restricted-properties
      ...(process.env.GOOGLE_CLIENT_ID &&
        // eslint-disable-next-line no-restricted-properties
        process.env.GOOGLE_CLIENT_SECRET && {
          google: {
            // eslint-disable-next-line no-restricted-properties
            clientId: process.env.GOOGLE_CLIENT_ID,
            // eslint-disable-next-line no-restricted-properties
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }),
    },
    plugins: [
      oAuthProxy({
        productionURL: options.productionUrl,
      }),
      expo(),
      ...(options.extraPlugins ?? []),
    ],
    trustedOrigins: ["expo://"],
    onAPIError: {
      onError(error) {
        console.error("BETTER AUTH API ERROR", error);
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
