import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { isDatabaseConfigured, isGoogleAuthConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const hasGoogle = isGoogleAuthConfigured();
const hasDatabase = isDatabaseConfigured() && prisma;
const adapter = hasDatabase && prisma ? PrismaAdapter(prisma) : undefined;
const calendarScope = "https://www.googleapis.com/auth/calendar.app.created";
const legacyCalendarScope = "https://www.googleapis.com/auth/calendar";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: hasGoogle
    ? [
        Google({
          authorization: {
            params: {
              scope: "openid email profile",
            },
          },
        }),
      ]
    : [],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
      }

      if (account?.provider === "google") {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleExpiresAt = account.expires_at ?? null;
        token.googleScope = account.scope ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }

      session.googleAccessToken =
        typeof token.googleAccessToken === "string"
          ? token.googleAccessToken
          : null;
      session.googleRefreshToken =
        typeof token.googleRefreshToken === "string"
          ? token.googleRefreshToken
          : null;
      session.googleExpiresAt =
        typeof token.googleExpiresAt === "number" ? token.googleExpiresAt : null;
      session.googleScope =
        typeof token.googleScope === "string" ? token.googleScope : null;
      session.googleConnected = Boolean(session.googleAccessToken);
      session.googleCalendarGranted =
        typeof token.googleScope === "string" &&
        (token.googleScope.includes(calendarScope) ||
          token.googleScope.includes(legacyCalendarScope));

      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
