"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount, useConnectWallet, useWallets } from "@mysten/dapp-kit";
import { startGoogleLogin } from "@/lib/zklogin";

const trustItems = [
  { icon: "ti-shield-check", label: "Non-custodial", desc: "Arbitra never holds your keys", color: "#22c55e" },
  { icon: "ti-link", label: "On-chain", desc: "All policies live on Sui", color: "#60a5fa" },
  { icon: "ti-bolt", label: "Instant", desc: "Revoke any agent in one click", color: "#f59e0b" },
];

const walletNames = [
  { name: "Sui Wallet", color: "#4DA2FF" },
  { name: "Martian", color: "#FF6B35" },
  { name: "Suiet", color: "#5B6AF9" },
  { name: "Ethos", color: "#22c55e" },
];

export default function ConnectPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const account = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connectWallet } = useConnectWallet();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (account) router.push("/");
  }, [account, router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    for (let i = 0; i < 180; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 1.4 + 0.2;
      const o = Math.random() * 0.5 + 0.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(148,163,184,${o})`;
      ctx.fill();
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const { startGoogleLogin } = await import("@/lib/zklogin");
      await startGoogleLogin();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnectWallet = () => {
    setConnecting(true);
    const suiWallet = wallets[0];
    if (suiWallet) {
      connectWallet(
        { wallet: suiWallet },
        {
          onSuccess: () => router.push("/"),
          onError: () => setConnecting(false),
        }
      );
    } else {
      window.open("https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil", "_blank");
      setConnecting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060a10", color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "40px 20px" }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, borderRadius: "50%", border: "1px solid rgba(96,165,250,0.12)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 850, height: 850, borderRadius: "50%", border: "1px solid rgba(96,165,250,0.06)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 780, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,#1a2d4a,#0f1e36)", border: "1px solid #2a4a7a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-shield-bolt" style={{ fontSize: 24, color: "#60a5fa" }} />
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9" }}>Arbitra</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 20, padding: "5px 16px", marginBottom: 30, fontSize: 13, color: "#94a3b8" }}>
          Workbench
          <span style={{ fontSize: 11, color: "#f59e0b", background: "#1a1200", border: "1px solid #d97706", padding: "1px 6px", borderRadius: 4 }}>Beta</span>
        </div>

        <h1 style={{ fontSize: 34, fontWeight: 700, color: "#f1f5f9", textAlign: "center", marginBottom: 12, lineHeight: 1.2 }}>
          Connect to Arbitra Workbench
        </h1>
        <p style={{ fontSize: 14, color: "#94a3b8", textAlign: "center", lineHeight: 1.8, marginBottom: 32 }}>
          Choose how you want to connect.<br />
          Your identity controls your agents.<br />
          Only you can deploy or revoke.
        </p>

        <div style={{ display: "flex", gap: 16, width: "100%", alignItems: "stretch", marginBottom: 32 }}>
          <div style={{ flex: 1, background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 16, padding: "32px 28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <i className="ti ti-wallet" style={{ fontSize: 36, color: "#f59e0b", marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f1f5f9", marginBottom: 12 }}>Connect Wallet</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 1.7, marginBottom: 22 }}>
              Use your Sui Wallet browser extension.<br />
              Full on-chain control. Your keys,<br />
              your agents.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, flexWrap: "wrap", justifyContent: "center" }}>
              {walletNames.map((wallet) => (
                <div key={wallet.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#94a3b8" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 3, background: wallet.color }} />
                  {wallet.name}
                </div>
              ))}
            </div>
            <button
              onClick={handleConnectWallet}
              disabled={connecting}
              style={{ width: "100%", padding: "13px 0", border: "1px solid #d97706", background: connecting ? "#1a1200" : "transparent", color: "#f59e0b", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: connecting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: "0 8px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 1, height: 60, background: "#1e2d45" }} />
              <span style={{ fontSize: 12, color: "#334155" }}>or</span>
              <div style={{ width: 1, height: 60, background: "#1e2d45" }} />
            </div>
          </div>

          <div style={{ flex: 1, background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 16, padding: "32px 28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 44, height: 44, marginBottom: 16 }}>
              <svg viewBox="0 0 44 44" width="44" height="44">
                <circle cx="22" cy="22" r="22" fill="#fff" />
                <path d="M42.2 22.5c0-1.4-.1-2.8-.4-4.1H22v7.8h11.4c-.5 2.6-2 4.8-4.2 6.3v5.2h6.8c4-3.7 6.2-9.1 6.2-15.2z" fill="#4285F4"/>
                <path d="M22 44c5.7 0 10.5-1.9 14-5.1l-6.8-5.2c-1.9 1.3-4.3 2-7.2 2-5.5 0-10.2-3.7-11.9-8.8H3.1v5.4C6.6 39.1 13.8 44 22 44z" fill="#34A853"/>
                <path d="M10.1 26.9c-.4-1.3-.7-2.6-.7-4s.2-2.7.7-4v-5.4H3.1C1.1 16.8 0 19.3 0 22s1.1 5.2 3.1 7.4l7-5.5z" fill="#FBBC05"/>
                <path d="M22 8.7c3.1 0 5.9 1.1 8.1 3.1l6-6C32.5 2.1 27.7 0 22 0 13.8 0 6.6 4.9 3.1 12.1l7 5.4C11.8 12.4 16.5 8.7 22 8.7z" fill="#EA4335"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f1f5f9", marginBottom: 12 }}>Sign in with Google</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 1.7, marginBottom: 20 }}>
              No wallet needed. Arbitra uses Sui zkLogin<br />
              to create a Sui address from your<br />
              Google account. One click.
            </p>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#0a1520", border: "1px solid #1e2d45", borderRadius: 8, padding: "12px 14px", marginBottom: 24, width: "100%" }}>
              <i className="ti ti-lock" style={{ fontSize: 15, color: "#60a5fa", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                Your Google account never touches the blockchain. Zero knowledge proof generated locally.
              </p>
            </div>
            <button
              onClick={handleGoogleLogin}
              style={{ width: "100%", padding: "13px 0", border: "none", background: "#2563eb", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              Sign in with Google
            </button>
          </div>
        </div>

        <div style={{ display: "flex", width: "100%", marginBottom: 28, background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 12, overflow: "hidden" }}>
          {trustItems.map((item, i) => (
            <div key={item.label} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderRight: i < trustItems.length - 1 ? "1px solid #1e2d45" : "none" }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 20, color: item.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: "#334155", textAlign: "center", lineHeight: 1.8, marginBottom: 12 }}>
          By connecting you agree to deploy policy objects on Sui testnet.<br />
          No real funds are used.
        </p>
        <a href="#" style={{ fontSize: 13, color: "#60a5fa", textDecoration: "none" }}>
          Read the docs <i className="ti ti-arrow-right" style={{ fontSize: 12 }} />
        </a>
      </div>
    </div>
  );
}
