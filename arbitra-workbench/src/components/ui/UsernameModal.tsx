"use client";

import { useState } from "react";

interface UsernameModalProps {
  defaultName: string;
  onConfirm: (username: string) => void;
}

export default function UsernameModal({ defaultName, onConfirm }: UsernameModalProps) {
  const [username, setUsername] = useState(defaultName);
  const [error, setError] = useState("");

  const handleConfirm = () => {
    const trimmed = username.trim();
    if (!trimmed) { setError("Username cannot be empty"); return; }
    if (trimmed.length < 3) { setError("At least 3 characters"); return; }
    if (trimmed.length > 20) { setError("Max 20 characters"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setError("Only letters, numbers and underscores"); return; }
    onConfirm(trimmed);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 16, padding: "32px 28px", width: 380, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#1a2d4a,#0f1e36)", border: "1px solid #2a4a7a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-user" style={{ fontSize: 22, color: "#60a5fa" }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f1f5f9", textAlign: "center" }}>Choose your username</h2>
        <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 1.6 }}>
          This is how you appear in Arbitra Workbench. You can change it later in settings.
        </p>
        <input
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          placeholder="Enter username"
          maxLength={20}
          style={{ width: "100%", background: "#080c14", border: `1px solid ${error ? "#ef4444" : "#1e2d45"}`, borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }}
        />
        {error && <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{error}</p>}
        <button
          onClick={handleConfirm}
          style={{ width: "100%", padding: "12px 0", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
        >
          Confirm Username
        </button>
      </div>
    </div>
  );
}
