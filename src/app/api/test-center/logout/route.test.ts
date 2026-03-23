import { TEST_CENTER_ACCESS_COOKIE_NAME } from "@/lib/test-center-access";

describe("test center logout route", () => {
  it("clears the internal access cookie and redirects back to the gate", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/test-center/logout", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/test-center");
    expect(response.headers.get("set-cookie")).toContain(TEST_CENTER_ACCESS_COOKIE_NAME);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
