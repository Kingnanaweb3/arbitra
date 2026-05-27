"use client";

import AppShell from "@/components/layout/AppShell";
import WizardShell from "@/components/wizard/WizardShell";
import { useRouter } from "next/navigation";

export default function NewAgentPage() {
  const router = useRouter();
  return (
    <AppShell>
      <WizardShell onExit={() => router.push("/")} />
    </AppShell>
  );
}
