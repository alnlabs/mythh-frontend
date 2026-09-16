export const ANONYMOUS_COOKIE = "mythh_anonymous_id";
export const ANONYMOUS_HEADER = "X-Mythh-Anonymous-Id";
export const ANONYMOUS_STORAGE = "mythh_anonymous_id";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAnonymousId(value?: string | null): value is string {
  return Boolean(value && uuidPattern.test(value));
}

function readDocumentCookie(name: string) {
  if (typeof document === "undefined") return "";
  for (const part of document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return rest.join("=");
      }
    }
  }
  return "";
}

export function persistAnonymousId(id: string) {
  if (!isAnonymousId(id) || typeof window === "undefined") return;

  try {
    localStorage.setItem(ANONYMOUS_STORAGE, id);
  } catch {
    /* private mode */
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const host = window.location.hostname;
  const domain =
    host === "mythh.in" || host === "www.mythh.in" || host.endsWith(".mythh.in")
      ? "; Domain=.mythh.in"
      : "";
  document.cookie = `${ANONYMOUS_COOKIE}=${id}; Path=/; Max-Age=${60 * 60 * 24 * 400}; SameSite=Lax${secure}${domain}`;
}

export function readAnonymousId() {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(ANONYMOUS_STORAGE);
    if (isAnonymousId(stored)) return stored;
  } catch {
    /* private mode */
  }

  const cookie = readDocumentCookie(ANONYMOUS_COOKIE);
  return isAnonymousId(cookie) ? cookie : null;
}

export function ensureAnonymousId() {
  const existing = readAnonymousId();
  if (existing) {
    persistAnonymousId(existing);
    return existing;
  }

  const next = crypto.randomUUID();
  persistAnonymousId(next);
  return next;
}

export async function anonymousIdForRequest() {
  if (typeof window !== "undefined") {
    return ensureAnonymousId();
  }

  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const value = jar.get(ANONYMOUS_COOKIE)?.value;
    return isAnonymousId(value) ? value : "";
  } catch {
    return "";
  }
}
