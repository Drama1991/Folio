import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/cookie";
import { Header } from "@/components/shell/Header";
import { Drawer } from "@/components/shell/Drawer";
import { ToastHost } from "@/components/shared/Toast";
import { RecordModal } from "@/components/record-modal/RecordModal";
import { RecordFAB } from "@/components/shell/RecordFAB";
import { AIPanel } from "@/components/ai-panel/AIPanel";
import { SyncTicker } from "@/components/shell/SyncTicker";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const display = session.display || session.handle;
  const acct = session.acct || `${session.handle}@${session.instance}`;

  return (
    <div className="shell">
      <Header display={display} handle={`@${acct}`} avatar={session.avatar} />
      <Drawer display={display} handle={`@${acct}`} avatar={session.avatar} />
      <main>{children}</main>
      <RecordModal />
      <AIPanel />
      <RecordFAB />
      <SyncTicker />
      <ToastHost />
    </div>
  );
}
