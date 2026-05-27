"use client";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default function Page() {
  const router = useRouter();
  return (
    <AppShell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, height: "100%" }}>
        <i className="ti ti-tools" style={{ fontSize: 40, color: "#334155" }} />
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#475569" }}>Coming Soon</h2>
        <p style={{ fontSize: 13, color: "#334155" }}>This page is under construction.</p>
        <button onClick={() => router.push("/")} style={{ fontSize: 13, color: "#60a5fa", background: "transparent", border: "1px solid #1e2d45", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}>
          Back to Dashboard
        </button>
      </div>
    </AppShell>
  );
}
