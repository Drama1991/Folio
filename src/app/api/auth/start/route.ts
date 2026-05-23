import { NextRequest, NextResponse } from "next/server";
import { setOAuthTransients } from "@/lib/auth/cookie";
import { registerApp, buildAuthorizeUrl, normalizeInstance, pkceChallenge } from "@/lib/neodb/oauth";

function publicUrl(): string {
  return process.env.FOLIO_PUBLIC_URL || "http://localhost:3000";
}

function randHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function redirectWithError(code: string): NextResponse {
  const u = new URL("/login", publicUrl());
  u.searchParams.set("error", code);
  return NextResponse.redirect(u);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rawInstance = url.searchParams.get("instance");
  if (!rawInstance) {
    return redirectWithError("missing_instance");
  }
  const instance = normalizeInstance(rawInstance);
  const redirectUri = `${publicUrl()}/api/auth/callback`;

  try {
    const app = await registerApp(instance, redirectUri);
    const state = randHex(16);
    const verifier = randHex(32); // 32 字节 hex = 64 字符，满足 PKCE RFC 7636 [43,128]
    await setOAuthTransients(state, verifier, instance, app.client_id, app.client_secret);

    const authorizeUrl = buildAuthorizeUrl({
      instance,
      clientId: app.client_id,
      redirectUri,
      state,
      codeChallenge: pkceChallenge(verifier),
    });
    return NextResponse.redirect(authorizeUrl);
  } catch (err) {
    console.error("[auth/start] register/authorize failed:", err);
    return redirectWithError("register_failed");
  }
}
