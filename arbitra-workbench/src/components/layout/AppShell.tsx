"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { getZkLoginAddress, getZkLoginUsername, clearZkLoginUser } from "@/lib/authStore";

const navItems = [
  { icon: "layout-dashboard", label: "Dashboard", path: "/" },
  { icon: "robot", label: "My Agents", path: "/my-agents" },
  { icon: "plus", label: "New Agent", path: "/new-agent" },
  { icon: "library", label: "Policy Library", path: "/policy-library" },
  { icon: "chart-bar", label: "Analytics", path: "/analytics" },
  { icon: "settings", label: "Settings", path: "/settings" },
  { icon: "file-text", label: "Docs", path: "/docs" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [shortAddress, setShortAddress] = useState<string | null>(null);

  useEffect(() => {
    const addr = account?.address ?? getZkLoginAddress();
    const username = getZkLoginUsername();
    if (addr) setShortAddress(addr.slice(0, 6) + "..." + addr.slice(-4));
    if (username) setDisplayName(username);
    else if (addr) setDisplayName(addr.slice(0, 6) + "..." + addr.slice(-4));
  }, [account]);

  const handleDisconnect = () => {
    disconnect();
    clearZkLoginUser();
    setDisplayName(null);
    setShortAddress(null);
  };

  const handleNav = (path: string) => {
    if (path === "/new-agent" && !shortAddress) {
      router.push("/connect");
      return;
    }
    router.push(path);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#060a10", color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <header style={{ height: 52, background: "#0b0f18", borderBottom: "1px solid #1a2234", display: "flex", alignItems: "center", padding: "0 20px", gap: 10, flexShrink: 0, zIndex: 10 }}>
        <i className="ti ti-shield-bolt" style={{ color: "#60a5fa", fontSize: 20 }} />
        <span style={{ fontWeight: 600, fontSize: 15 }}>Arbitra</span>
        <span style={{ color: "#475569", fontSize: 13 }}>Workbench</span>
        <span style={{ fontSize: 10, color: "#64748b", background: "#151d2e", border: "1px solid #1e2d45", padding: "2px 7px", borderRadius: 4 }}>Beta</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {displayName ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 7, padding: "6px 12px", fontSize: 12, color: "#94a3b8" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                {displayName}
              </div>
              <button onClick={handleDisconnect} style={{ background: "transparent", border: "1px solid #1e2d45", color: "#64748b", padding: "6px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer" }}>
                Disconnect
              </button>
            </>
          ) : (
            <>
              <button onClick={() => router.push("/connect")} style={{ border: "1px solid #d97706", color: "#f59e0b", background: "transparent", padding: "6px 14px", borderRadius: 7, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-wallet" style={{ fontSize: 12 }} /> Connect Wallet
              </button>
              <button onClick={() => router.push("/connect")} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 7, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-brand-google" style={{ fontSize: 12 }} /> Sign in with Google
              </button>
            </>
          )}
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <aside style={{ width: 200, background: "#080c14", borderRight: "1px solid #1a2234", display: "flex", flexDirection: "column", padding: "10px 0", flexShrink: 0 }}>
          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none", background: pathname === item.path ? "#1a2d4a" : "transparent", color: pathname === item.path ? "#60a5fa" : "#64748b", width: "100%", textAlign: "left" }}
              >
                <i className={`ti ti-${item.icon}`} style={{ fontSize: 16 }} />
                {item.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: "12px 16px", borderTop: "1px solid #1a2234", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            {shortAddress ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a2d4a", border: "1px solid #2a4a7a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-user" style={{ fontSize: 13, color: "#60a5fa" }} />
                </div>
                <div>
                  <div style={{ color: "#94a3b8", fontSize: 11 }}>{shortAddress}</div>
                  <div style={{ color: "#334155", fontSize: 10 }}>Sui Testnet</div>
                </div>
              </div>
            ) : (
              <><i className="ti ti-wallet" style={{ fontSize: 16, color: "#475569" }} /><span style={{ color: "#475569" }}>Connect Wallet</span></>
            )}
          </div>
        </aside>

        <main style={{ flex: 1, overflow: "auto" }}>
          {children}
        </main>
      </div>

      <footer style={{ height: 34, background: "#080c14", borderTop: "1px solid #1a2234", display: "flex", alignItems: "center", padding: "0 20px", gap: 20, flexShrink: 0 }}>
        {[
          { label: "Sui Testnet", color: "#3b82f6" },
          { label: "Pyth: Live", color: "#22c55e" },
          { label: "Walrus: Synced", color: "#22c55e" },
          { label: "Deepbook: Connected", color: "#22c55e" },
        ].map((item, i) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <span style={{ color: "#334155", marginRight: 8 }}>·</span>}
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "#475569" }}>{item.label}</span>
          </div>
        ))}
      </footer>
    </div>
  );
}
