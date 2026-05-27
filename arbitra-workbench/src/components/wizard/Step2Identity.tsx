"use client";

import { useState } from "react";
import { WizardState, agentTypeConfig } from "@/lib/wizardState";

const presetIcons = [
  "ti-trending-up",
  "ti-chart-candle",
  "ti-robot",
  "ti-bolt",
  "ti-shield-bolt",
  "ti-cpu",
  "ti-building-bank",
  "ti-shopping-cart",
  "ti-credit-card",
];

interface Step2Props {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function Step2Identity({ state, onChange, onContinue, onBack }: Step2Props) {
  const [nameError, setNameError] = useState("");
  const config = state.agentType ? agentTypeConfig[state.agentType] : null;

  const handleContinue = () => {
    if (!state.agentName.trim()) {
      setNameError("Agent name is required");
      return;
    }
    if (state.agentName.trim().length < 3) {
      setNameError("At least 3 characters");
      return;
    }
    setNameError("");
    onContinue();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f1f5f9", marginBottom: 8 }}>
            Name your agent.
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
            This is how you will identify it across your dashboard and activity logs.
          </p>
        </div>

        {config && state.agentType && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0e1623", border: `1px solid ${config.borderColor}`, borderRadius: 8, padding: "8px 16px" }}>
              <i className={`ti ${config.icon}`} style={{ fontSize: 16, color: config.color }} />
              <span style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 500 }}>{config.label}</span>
            </div>
            <button
              onClick={onBack}
              style={{ fontSize: 12, color: "#60a5fa", background: "transparent", border: "1px solid #1e2d45", padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}
            >
              Change
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 6 }}>
              Agent Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              value={state.agentName}
              onChange={(e) => { onChange({ agentName: e.target.value }); setNameError(""); }}
              placeholder="My Trading Agent"
              maxLength={40}
              style={{ width: "100%", background: "#080c14", border: `1px solid ${nameError ? "#ef4444" : "#1e2d45"}`, borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }}
            />
            {nameError ? (
              <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{nameError}</p>
            ) : (
              <p style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>This appears in your dashboard and logs</p>
            )}
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 6 }}>
              Agent Description <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              value={state.agentDescription}
              onChange={(e) => onChange({ agentDescription: e.target.value })}
              placeholder={config ? `${config.label} — describe what it does` : "What does this agent do?"}
              maxLength={100}
              style={{ width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }}
            />
            <p style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>For your reference only</p>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 6 }}>
              Agent Icon
            </label>
            <p style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>Choose how this agent appears in your dashboard</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {presetIcons.map((icon) => (
                <button
                  key={icon}
                  onClick={() => onChange({ agentIcon: icon })}
                  style={{ width: 44, height: 44, borderRadius: 8, border: `1px solid ${state.agentIcon === icon ? "#2563eb" : "#1e2d45"}`, background: state.agentIcon === icon ? "#1a2d4a" : "#080c14", color: state.agentIcon === icon ? "#60a5fa" : "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <i className={`ti ${icon}`} style={{ fontSize: 18 }} />
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#334155" }}>default presets</p>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 6 }}>
              Agent Tag <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              value={state.agentTag}
              onChange={(e) => onChange({ agentTag: e.target.value })}
              placeholder="e.g. production, test, hackathon"
              maxLength={30}
              style={{ width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }}
            />
            <p style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Helps organize agents when you have multiple</p>
          </div>

          <div style={{ background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <i className="ti ti-info-circle" style={{ fontSize: 15, color: "#60a5fa", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Your agent name and icon are stored locally. Only the policy parameters are written on-chain.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          <button
            onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid #1e2d45", color: "#94a3b8", padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} /> Back
          </button>
          <button
            onClick={handleContinue}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", border: "none", padding: "10px 28px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Continue <i className="ti ti-arrow-right" style={{ fontSize: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}
