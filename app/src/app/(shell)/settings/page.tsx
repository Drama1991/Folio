import { getSession } from "@/lib/auth/cookie";
import { SettingsContent } from "@/components/settings/SettingsContent";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;
  return (
    <SettingsContent
      instance={session.instance}
      handle={session.handle}
      acct={session.acct ?? `${session.handle}@${session.instance}`}
      display={session.display ?? session.handle}
    />
  );
}
