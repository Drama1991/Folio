import { LoginCard } from "@/components/login/LoginCard";

interface SP { error?: string }

export default async function LoginPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  return <LoginCard initialError={sp.error} />;
}
