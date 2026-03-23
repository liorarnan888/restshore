import {
  buildTestCenterAccessCookie,
  buildTestCenterAccessToken,
  sanitizeTestCenterRedirectTarget,
  TEST_CENTER_ACCESS_COOKIE_NAME,
  verifyTestCenterAccessToken,
  verifyTestCenterPassword,
} from "@/lib/test-center-access";

const originalEnv = {
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  TEST_CENTER_PASSWORD: process.env.TEST_CENTER_PASSWORD,
};

describe("test center access", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "signing-secret";
    delete process.env.NEXTAUTH_SECRET;
    process.env.TEST_CENTER_PASSWORD = "open-sesame";
  });

  afterEach(() => {
    if (originalEnv.AUTH_SECRET === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = originalEnv.AUTH_SECRET;
    }

    if (originalEnv.NEXTAUTH_SECRET === undefined) {
      delete process.env.NEXTAUTH_SECRET;
    } else {
      process.env.NEXTAUTH_SECRET = originalEnv.NEXTAUTH_SECRET;
    }

    if (originalEnv.TEST_CENTER_PASSWORD === undefined) {
      delete process.env.TEST_CENTER_PASSWORD;
    } else {
      process.env.TEST_CENTER_PASSWORD = originalEnv.TEST_CENTER_PASSWORD;
    }
  });

  it("verifies the configured password without exposing the actual value", () => {
    expect(verifyTestCenterPassword("open-sesame")).toBe(true);
    expect(verifyTestCenterPassword("wrong-password")).toBe(false);
  });

  it("creates and validates a signed access token", () => {
    const token = buildTestCenterAccessToken(1_000);

    expect(token).toBeTruthy();
    expect(verifyTestCenterAccessToken(token, 1_000)).toBe(true);
    expect(verifyTestCenterAccessToken(token, 86_401_001)).toBe(false);
  });

  it("produces a cookie object for the production gate", () => {
    const cookie = buildTestCenterAccessCookie(1_000);

    expect(cookie?.name).toBe(TEST_CENTER_ACCESS_COOKIE_NAME);
    expect(cookie?.value).toBeTruthy();
    expect(cookie?.options.httpOnly).toBe(true);
    expect(cookie?.options.sameSite).toBe("lax");
    expect(cookie?.options.path).toBe("/");
  });

  it("keeps redirect targets inside the test center surface", () => {
    expect(
      sanitizeTestCenterRedirectTarget("/test-center?session=abc&error=invalid"),
    ).toBe("/test-center?session=abc&error=invalid");
    expect(sanitizeTestCenterRedirectTarget("https://example.com")).toBe("/test-center");
    expect(sanitizeTestCenterRedirectTarget("/report/abc")).toBe("/test-center");
  });
});
