import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    googleAccessToken?: string | null;
    googleRefreshToken?: string | null;
    googleExpiresAt?: number | null;
    googleScope?: string | null;
    googleConnected?: boolean;
    googleCalendarGranted?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    googleAccessToken?: string | null;
    googleRefreshToken?: string | null;
    googleExpiresAt?: number | null;
    googleScope?: string | null;
  }
}
