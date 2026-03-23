import { TEST_CENTER_ACCESS_COOKIE_NAME } from "@/lib/test-center-access";

const originalEnv = {
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  TEST_CENTER_PASSWORD: process.env.TEST_CENTER_PASSWORD,
};

describe("test center login route", () => {
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

  it("sets a signed cookie and redirects back to the requested test-center path", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/test-center/login", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        password: "open-sesame",
        redirectTo: "/test-center?session=abc",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/test-center?session=abc");
    expect(response.headers.get("set-cookie")).toContain(TEST_CENTER_ACCESS_COOKIE_NAME);
  });

  it("returns the login form to the gate when the password is wrong", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/test-center/login", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        password: "wrong-password",
        redirectTo: "/test-center?session=abc",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/test-center?session=abc");
    expect(response.headers.get("location")).toContain("error=invalid");
  });
});
