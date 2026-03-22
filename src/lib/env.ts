export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function isGoogleAuthConfigured() {
  return Boolean(
    process.env.AUTH_SECRET &&
      process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET,
  );
}
