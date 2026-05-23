import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/cookie";
import { SettingsContent } from "@/components/settings/SettingsContent";
import pkg from "../../../../package.json";

export default async function SettingsPage() {
  const session = await getSession();
  // P1-7：未登录时显式跳转到 /login，而不是 return null 渲染空白。
  if (!session) redirect("/login?next=/settings");

  const h = await headers();
  const ua = h.get("user-agent") ?? "";

  return (
    <SettingsContent
      instance={session.instance}
      handle={session.handle}
      acct={session.acct ?? `${session.handle}@${session.instance}`}
      display={session.display ?? session.handle}
      version={pkg.version}
      buildDate={new Date().toISOString().slice(0, 10)}
      sessionIat={typeof session.iat === "number" ? session.iat : null}
      sessionExp={typeof session.exp === "number" ? session.exp : null}
      userAgent={ua}
    />
  );
}
