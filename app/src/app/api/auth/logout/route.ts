import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookie";

function publicUrl(): string {
  return process.env.FOLIO_PUBLIC_URL || "http://localhost:3000";
}

export async function POST() {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", publicUrl()), { status: 303 });
}

export async function GET() {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", publicUrl()));
}
