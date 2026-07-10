export function appendQuery(
  input: string,
  params: Record<string, string | number>,
): string {
  const hashIndex = input.indexOf("#");
  const path = hashIndex >= 0 ? input.slice(0, hashIndex) : input;
  const hash = hashIndex >= 0 ? input.slice(hashIndex) : "";
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    query.append(key, String(value));
  }

  const serialized = query.toString();
  if (!serialized) return input;

  const separator = path.includes("?")
    ? path.endsWith("?") || path.endsWith("&")
      ? ""
      : "&"
    : "?";
  return `${path}${separator}${serialized}${hash}`;
}

export function isAllowedExternalUrl(input: string): boolean {
  if (!input.trim()) return false;
  try {
    const url = new URL(input, "https://onedays.invalid");
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isOwnedCacheKey(key: string): boolean {
  return key.startsWith("onedays-");
}

export function isOwnedServiceWorkerScope(
  scope: string,
  appScope: string,
): boolean {
  try {
    return new URL(scope).href === new URL(appScope).href;
  } catch {
    return false;
  }
}

export function readStorage(
  key: string,
  fallback: string | null = null,
): string | null {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): boolean {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
