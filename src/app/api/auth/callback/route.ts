import { NextRequest, NextResponse } from "next/server";
import { consumeOAuthTransients, setSessionCookie } from "@/lib/auth/cookie";
import { exchangeCode, fetchAccount } from "@/lib/neodb/oauth";
import { signSession } from "@/lib/auth/session";

function publicUrl(): string {
  return process.env.FOLIO_PUBLIC_URL || "http://localhost:3000";
}

function redirectWithError(code: string): NextResponse {
  const u = new URL("/login", publicUrl());
  u.searchParams.set("error", code);
  return NextResponse.redirect(u);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const upstreamError = url.searchParams.get("error");

  if (upstreamError) {
    console.error("[auth/callback] upstream denied:", upstreamError, url.searchParams.get("error_description"));
    return redirectWithError("upstream_denied");
  }
  if (!code || !stateParam) {
    return redirectWithError("missing_code_or_state");
  }

  const { state, verifier, instance, clientId, clientSecret } = await consumeOAuthTransients();
  if (!state || !instance || !verifier || !clientId || !clientSecret || state !== stateParam) {
    console.error("[auth/callback] state/verifier/client mismatch", {
      hasState: !!state,
      hasVerifier: !!verifier,
      hasInstance: !!instance,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      stateMatched: state === stateParam,
    });
    return redirectWithError("state_mismatch");
  }

  const redirectUri = `${publicUrl()}/api/auth/callback`;

  let tok;
  try {
    tok = await exchangeCode({
      instance,
      clientId,
      clientSecret,
      redirectUri,
      code,
      codeVerifier: verifier,
    });
  } catch (err) {
    console.error("[auth/callback] token exchange failed:", err);
    return redirectWithError("token_exchange_failed");
  }

  let me;
  try {
    me = await fetchAccount(instance, tok.access_token);
  } catch (err) {
    console.error("[auth/callback] fetch account failed:", err);
    return redirectWithError("account_fetch_failed");
  }

  try {
    const jwt = await signSession({
      instance,
      token: tok.access_token,
      handle: me.username,
      sub: me.id,
      acct: me.acct,
      display: me.display_name,
      avatar: me.avatar,
    });
    await setSessionCookie(jwt);
    return NextResponse.redirect(new URL("/home", publicUrl()));
  } catch (err) {
    console.error("[auth/callback] session sign failed:", err);
    return redirectWithError("unknown");
  }
}
