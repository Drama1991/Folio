import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS, verifySession, type FolioSession } from "./session";

export async function getSession(): Promise<FolioSession | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifySession(raw);
}

export async function setSessionCookie(jwt: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

const PKCE_COOKIE = "folio_pkce";
const STATE_COOKIE = "folio_state";
const INST_COOKIE = "folio_pending_instance";

export async function setOAuthTransients(state: string, codeVerifier: string, instance: string): Promise<void> {
  const store = await cookies();
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 10 * 60, // 10 min
  };
  store.set(STATE_COOKIE, state, common);
  store.set(PKCE_COOKIE, codeVerifier, common);
  store.set(INST_COOKIE, instance, common);
}

export async function consumeOAuthTransients(): Promise<{
  state: string | undefined;
  verifier: string | undefined;
  instance: string | undefined;
}> {
  const store = await cookies();
  const state = store.get(STATE_COOKIE)?.value;
  const verifier = store.get(PKCE_COOKIE)?.value;
  const instance = store.get(INST_COOKIE)?.value;
  store.delete(STATE_COOKIE);
  store.delete(PKCE_COOKIE);
  store.delete(INST_COOKIE);
  return { state, verifier, instance };
}
