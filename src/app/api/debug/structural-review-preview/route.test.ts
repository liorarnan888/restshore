import { buildTestCenterAccessToken } from "@/lib/test-center-access";

const originalEnv = {
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  TEST_CENTER_PASSWORD: process.env.TEST_CENTER_PASSWORD,
  NODE_ENV: process.env.NODE_ENV,
};

describe("structural review preview route gating", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
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

    if (originalEnv.NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalEnv.NODE_ENV;
    }
  });

  it("blocks production requests without the internal cookie", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/debug/structural-review-preview", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sessionId: "missing-session",
        scenario: "stable_expand",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: "Not available in production" }),
    );
  }, 15000);

  it("allows production requests with a valid internal cookie", async () => {
    const { POST } = await import("./route");
    const token = buildTestCenterAccessToken();

    if (!token) {
      throw new Error("Expected a signed test center token");
    }

    const request = new Request("http://localhost/api/debug/structural-review-preview", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `restshore_test_center_access=${token}`,
      },
      body: JSON.stringify({
        sessionId: "missing-session",
        scenario: "stable_expand",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: "Session not ready" }),
    );
  }, 15000);
});
