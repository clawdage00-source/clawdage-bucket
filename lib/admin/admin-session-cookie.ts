/**
 * Signed admin gate cookie (Edge + Node compatible via Web Crypto).
 */

export const ADMIN_SESSION_COOKIE = "clawdage_admin_session";

/** Hard max lifetime and inactivity window (seconds). */
export const ADMIN_SESSION_MAX_AGE_SEC = 2 * 60 * 60;

export type AdminSessionPayload = {
  v: 1;
  /** Last activity (unix seconds). */
  iat: number;
  /** Hard expiry (unix seconds). */
  exp: number;
};

function getSigningSecret(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET?.trim();
  if (explicit) return explicit;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return service || null;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? padded : padded + "=".repeat(4 - (padded.length % 4));
    const binary = atob(pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signPayload(encodedPayload: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload),
  );
  return toBase64Url(new Uint8Array(signature));
}

async function verifySignature(
  encodedPayload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const sigBytes = fromBase64Url(signature);
  if (!sigBytes) return false;
  const key = await importHmacKey(secret);
  const signatureBuffer = new Uint8Array(sigBytes).buffer;
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBuffer,
    new TextEncoder().encode(encodedPayload),
  );
}

export async function encodeAdminSessionCookie(
  payload: AdminSessionPayload,
): Promise<string | null> {
  const secret = getSigningSecret();
  if (!secret) return null;
  const encodedPayload = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export async function decodeAdminSessionCookie(
  token: string | undefined | null,
): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  const secret = getSigningSecret();
  if (!secret) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const valid = await verifySignature(encodedPayload, signature, secret);
  if (!valid) return null;

  const bytes = fromBase64Url(encodedPayload);
  if (!bytes) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as AdminSessionPayload;
    if (payload.v !== 1 || !payload.iat || !payload.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    if (now - payload.iat > ADMIN_SESSION_MAX_AGE_SEC) return null;

    return payload;
  } catch {
    return null;
  }
}

export function buildAdminSessionPayload(): AdminSessionPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    v: 1,
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE_SEC,
  };
}

export function refreshAdminSessionActivity(payload: AdminSessionPayload): AdminSessionPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    ...payload,
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE_SEC,
  };
}

export function adminSessionCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}
