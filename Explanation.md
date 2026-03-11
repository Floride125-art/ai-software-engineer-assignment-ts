# Explanation

## What was the bug?

In `src/httpClient.ts`, the `request` method failed to refresh the OAuth2 token when `oauth2Token` was set to a plain object (i.e. `Record<string, unknown>`) instead of a proper `OAuth2Token` instance. In that case, no `Authorization` header was added to the request.

## Why did it happen?

The refresh condition was:

```ts
if (
  !this.oauth2Token ||
  (this.oauth2Token instanceof OAuth2Token && this.oauth2Token.expired)
)
```

A plain object is **truthy**, so `!this.oauth2Token` is `false`. It also fails the `instanceof OAuth2Token` check, so the entire condition evaluates to `false`, the token is never refreshed. Then the subsequent `instanceof` guard also fails, so `asHeader()` is never called and no `Authorization` header is set.

## Why does your fix solve it?

The fix changes the condition to:

```ts
if (
  !this.oauth2Token ||
  !(this.oauth2Token instanceof OAuth2Token) ||
  this.oauth2Token.expired
)
```

Now any value that is not a proper `OAuth2Token` instance (including plain objects) triggers a refresh. After the refresh, `oauth2Token` is always a valid `OAuth2Token`, so `asHeader()` is called correctly.

## One edge case the tests still don't cover

A race condition where `refreshOAuth2()` is called concurrently by two requests at the same time (e.g. in an async context). Both calls could observe a stale/plain-object token simultaneously, triggering two refreshes; potentially overwriting a just-issued token with a second one, or issuing two requests for new tokens unnecessarily.
