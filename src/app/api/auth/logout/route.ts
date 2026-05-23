import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookie";

function publicUrl(): string {
  return process.env.FOLIO_PUBLIC_URL || "http://localhost:3000";
}

// P1-8：只接受 POST。GET 注销会被 <img src> 等跨站构造触发，SameSite=lax 只是部分缓解。
export async function POST() {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", publicUrl()), { status: 303 });
}
