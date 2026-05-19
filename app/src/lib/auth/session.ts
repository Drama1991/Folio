import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SESSION_COOKIE = "folio_session";
const SESSION_TTL_DAYS = 30;

export interface FolioSession extends JWTPayload {
  instance: string; // e.g. "neodb.social"
  token: string;    // OAuth access token (NeoDB)
  handle: string;   // e.g. "morsel"
  sub: string;      // account id
  acct?: string;    // full federated handle e.g. "morsel@neodb.social"
  display?: string; // display name
  avatar?: string;  // avatar URL
}

function getSecret(): Uint8Array {
  const raw = process.env.FOLIO_JWT_SECRET;
  if (!raw || raw.length < 16) {
    throw new Error("FOLIO_JWT_SECRET is missing or too short (need ≥16 chars)");
  }
  return new TextEncoder().encode(raw);
}

export async function signSession(payload: Omit<FolioSession, "iat" | "exp">): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(getSecret());
}

export async function verifySession(jwt: string): Promise<FolioSession | null> {
  try {
    const { payload } = await jwtVerify(jwt, getSecret(), { algorithms: ["HS256"] });
    return payload as FolioSession;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;
