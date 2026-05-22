import { NextRequest, NextResponse } from "next/server";
import { setOAuthTransients } from "@/lib/auth/cookie";
import { registerApp, buildAuthorizeUrl, normalizeInstance } from "@/lib/neodb/oauth";

function publicUrl(): string {
  return process.env.FOLIO_PUBLIC_URL || "http://localhost:3000";
}

function randHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rawInstance = url.searchParams.get("instance");
  if (!rawInstance) {
    return NextResponse.json({ error: "missing instance" }, { status: 400 });
  }
  const instance = normalizeInstance(rawInstance);
  const redirectUri = `${publicUrl()}/api/auth/callback`;

  try {
    const app = await registerApp(instance, redirectUri);
    const state = randHex(16);
    const verifier = randHex(32); // reserved for future PKCE
    await setOAuthTransients(state, verifier, instance);

    const authorizeUrl = buildAuthorizeUrl({
      instance,
      clientId: app.client_id,
      redirectUri,
      state,
    });
    return NextResponse.redirect(authorizeUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "auth start failed";
    const loginUrl = new URL("/login", publicUrl());
    loginUrl.searchParams.set("error", msg);
    return NextResponse.redirect(loginUrl);
  }
}
