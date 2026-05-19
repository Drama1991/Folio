import { NextRequest, NextResponse } from "next/server";
import { consumeOAuthTransients, setSessionCookie } from "@/lib/auth/cookie";
import { getApp } from "@/lib/auth/apps-cache";
import { exchangeCode, fetchAccount } from "@/lib/neodb/oauth";
import { signSession } from "@/lib/auth/session";

function publicUrl(): string {
  return process.env.FOLIO_PUBLIC_URL || "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const loginUrl = new URL("/login", publicUrl());

  if (error) {
    loginUrl.searchParams.set("error", error);
    return NextResponse.redirect(loginUrl);
  }
  if (!code || !stateParam) {
    loginUrl.searchParams.set("error", "missing_code_or_state");
    return NextResponse.redirect(loginUrl);
  }

  const { state, instance } = await consumeOAuthTransients();
  if (!state || !instance || state !== stateParam) {
    loginUrl.searchParams.set("error", "state_mismatch");
    return NextResponse.redirect(loginUrl);
  }

  const app = await getApp(instance);
  if (!app) {
    loginUrl.searchParams.set("error", "app_not_found");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const redirectUri = `${publicUrl()}/api/auth/callback`;
    const tok = await exchangeCode({
      instance,
      clientId: app.client_id,
      clientSecret: app.client_secret,
      redirectUri,
      code,
    });

    const me = await fetchAccount(instance, tok.access_token);
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
    const msg = err instanceof Error ? err.message : "callback failed";
    loginUrl.searchParams.set("error", msg);
    return NextResponse.redirect(loginUrl);
  }
}
