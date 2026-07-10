import test from "node:test";
import assert from "node:assert/strict";
import {
  appendQuery,
  isAllowedExternalUrl,
  isOwnedCacheKey,
  isOwnedServiceWorkerScope,
  readStorage,
  removeStorage,
  writeStorage,
} from "../src/js/runtime-guards.ts";

test("appendQuery preserves an existing query string", () => {
  assert.equal(
    appendQuery("https://example.com/feed?format=json", { v: "123" }),
    "https://example.com/feed?format=json&v=123",
  );
});

test("appendQuery keeps repeated parameters such as API categories", () => {
  const withFirst = appendQuery("https://example.com/feed", { c: "a" });
  assert.equal(appendQuery(withFirst, { c: "b" }), "https://example.com/feed?c=a&c=b");
});

test("external links only allow http and https", () => {
  assert.equal(isAllowedExternalUrl("https://example.com/a"), true);
  assert.equal(isAllowedExternalUrl("http://example.com/a"), true);
  assert.equal(isAllowedExternalUrl("/quote/1"), true);
  assert.equal(isAllowedExternalUrl("javascript:alert(1)"), false);
  assert.equal(isAllowedExternalUrl("data:text/html,pwned"), false);
});

test("cache cleanup is limited to the application namespace", () => {
  assert.equal(isOwnedCacheKey("onedays-assets-v1"), true);
  assert.equal(isOwnedCacheKey("other-app-assets-v1"), false);
});

test("service worker cleanup only accepts the application scope", () => {
  assert.equal(
    isOwnedServiceWorkerScope("https://example.com/onedays/", "https://example.com/onedays/"),
    true,
  );
  assert.equal(
    isOwnedServiceWorkerScope("https://example.com/other-app/", "https://example.com/onedays/"),
    false,
  );
});

test("storage guards fall back when localStorage is unavailable", () => {
  const previousWindow = globalThis.window;
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  };

  assert.equal(readStorage("missing", "fallback"), "fallback");
  assert.equal(writeStorage("key", "value"), true);
  assert.equal(readStorage("key"), "value");

  globalThis.window = {
    localStorage: {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    },
  };
  assert.equal(readStorage("blocked", "fallback"), "fallback");
  assert.equal(writeStorage("blocked", "value"), false);
  assert.equal(removeStorage("blocked"), false);

  if (previousWindow === undefined) delete globalThis.window;
  else globalThis.window = previousWindow;
});
