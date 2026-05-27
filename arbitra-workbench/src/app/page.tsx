"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import AppShell from "@/components/layout/AppShell";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getZkLoginAddress } from "@/lib/authStore";

const demoAgents = [
  { icon: "trending-up", color: "#60a5fa", borderColor: "#2563eb", title: "Trading Agent", desc: "DCA strategy on Deepbook with live risk guardian." },
  { icon: "shopping-cart", color: "#f59e0b", borderColor: "#d97706", title: "E-Commerce Agent", desc: "Purchases from approved vendors within a weekly budget." },
  { icon: "building-bank", color: "#60a5fa", borderColor: "#2563eb", title: "DAO Treasury Agent", desc: "Recurring grants within a monthly allocation." },
];

const trustItems = [
  { icon: "lock", label: "Trustless", desc: "Rules enforced at the VM level.", color: "#60a5fa" },
  { icon: "file-check", label: "Auditable", desc: "Every action logged on-chain.", color: "#f59e0b" },
  { icon: "shield-check", label: "In Control", desc: "Revoke any agent instantly.", color: "#60a5fa" },
];

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const account = useCurrentAccount();

  const isConnected = !!(account?.address || getZkLoginAddress());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 1.3 + 0.2;
      const o = Math.random() * 0.4 + 0.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(148,163,184,${o})`;
      ctx.fill();
    }
  }, []);

  return (
    <AppShell>
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", height: "100%" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 640, padding: "0 32px" }}>
          <p style={{ fontSize: 11, color: "#334155", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 18 }}>No agents deployed</p>

          <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 22px" }}>
            <div style={{ position: "absolute", top: -12, left: -12, right: -12, bottom: -12, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)" }} />
            <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#1a2d4a,#0f1e36)", border: "1px solid #2a4a7a", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-shield-bolt" style={{ fontSize: 30, color: "#60a5fa" }} />
            </div>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.3, marginBottom: 10 }}>
            Give your AI agent a policy.<br />
            <span style={{ color: "#60a5fa" }}>Not a leash.</span>
          </h1>

          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 26, maxWidth: 360, margin: "0 auto 26px" }}>
            Connect any AI agent and deploy on-chain spending rules it cannot override — in minutes.
          </p>

          <button
            onClick={() => isConnected ? router.push("/new-agent") : router.push("/connect")}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", border: "none", padding: "11px 26px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", marginBottom: 26 }}
          >
            <i className="ti ti-plus" style={{ fontSize: 14 }} /> Create Your First Agent
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, color: "#334155", fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, background: "#1a2234" }} />
            or try a live demo
            <div style={{ flex: 1, height: 1, background: "#1a2234" }} />
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 28 }}>
            {demoAgents.map(agent => (
              <div key={agent.title} style={{ background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 10, padding: "16px 14px", width: 148, textAlign: "center", cursor: "pointer" }}>
                <i className={`ti ti-${agent.icon}`} style={{ fontSize: 26, color: agent.color, display: "block", marginBottom: 10 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>{agent.title}</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.55, marginBottom: 12 }}>{agent.desc}</div>
                <button style={{ fontSize: 11, width: "100%", padding: "5px 0", borderRadius: 5, cursor: "pointer", background: "transparent", border: `1px solid ${agent.borderColor}`, color: agent.color }}>
                  Launch Demo
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
            {trustItems.map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <i className={`ti ti-${item.icon}`} style={{ fontSize: 16, color: item.color }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: item.color }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
