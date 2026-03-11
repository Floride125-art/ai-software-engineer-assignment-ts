import { HttpClient } from "../src/httpClient";
import { OAuth2Token } from "../src/tokens";
import { describe, test, expect } from "vitest";

describe("HttpClient OAuth2 behavior", () => {
  test("api=true sets Authorization header when token is valid", () => {
    const c = new HttpClient();
    c.oauth2Token = new OAuth2Token("ok", Math.floor(Date.now() / 1000) + 3600);

    const resp = c.request("GET", "/me", { api: true });

    expect(resp.headers.Authorization).toBe("Bearer ok");
  });

  test("api=true refreshes when token is missing", () => {
    const c = new HttpClient();
    c.oauth2Token = null;

    const resp = c.request("GET", "/me", { api: true });

    expect(resp.headers.Authorization).toBe("Bearer fresh-token");
  });

  test("api=true refreshes when token is a plain object", () => {
    // This is the key failing case: a plain object is truthy so !token is false,
    // and it fails instanceof, so the old condition never triggered a refresh.
    const c = new HttpClient();
    c.oauth2Token = { accessToken: "stale", expiresAt: 0 };

    const resp = c.request("GET", "/me", { api: true });

    expect(resp.headers.Authorization).toBe("Bearer fresh-token");
  });

  test("api=true refreshes when OAuth2Token is expired", () => {
    const c = new HttpClient();
    c.oauth2Token = new OAuth2Token("expired-token", Math.floor(Date.now() / 1000) - 1);

    const resp = c.request("GET", "/me", { api: true });

    expect(resp.headers.Authorization).toBe("Bearer fresh-token");
  });

  test("api=false does not set Authorization header", () => {
    const c = new HttpClient();
    c.oauth2Token = new OAuth2Token("ok", Math.floor(Date.now() / 1000) + 3600);

    const resp = c.request("GET", "/public", { api: false });

    expect(resp.headers.Authorization).toBeUndefined();
  });

  test("non-api request preserves caller-supplied headers", () => {
    const c = new HttpClient();

    const resp = c.request("POST", "/data", { headers: { "X-Custom": "value" } });

    expect(resp.headers["X-Custom"]).toBe("value");
    expect(resp.headers.Authorization).toBeUndefined();
  });
});