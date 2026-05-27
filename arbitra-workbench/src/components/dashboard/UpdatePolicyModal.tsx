"use client";

import { useState } from "react";
import { DeployedAgent } from "@/lib/agentStore";

interface UpdatePolicyModalProps {
  agent: DeployedAgent;
  onClose: () => void;
  onUpdate: (updates: { riskCeiling: number; slippageGuardBps: number; maxSingleTx: number }) => void;
}

export default function UpdatePolicyModal({ agent, onClose, onUpdate }: UpdatePolicyModalProps) {
  const [riskCeiling, setRiskCeiling] = useState(agent.riskCeiling);
  const [slippageBps, setSlippageBps] = useState(agent.slippageGuardBps);
  const [maxTx, setMaxTx] = useState(agent.maxSingleTx);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isTrading = agent.agentType === "trading";

  const riskColor = riskCeiling > 74 ? "#ef4444" : riskCeiling > 49 ? "#f59e0b" : "#60a5fa";

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    onUpdate({ riskCeiling, slippageGuardBps: slippageBps, maxSingleTx: maxTx });
    setSaving(false);
    setSaved(true);
    await new Promise(r => setTimeout(r, 800));
    onClose();
  };

  const s = {
    overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modal: { background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 14, width: 520, maxHeight: "90vh", overflowY: "auto" as const, fontFamily: "'DM Sans', sans-serif" },
    header: { padding: "20px 24px", borderBottom: "1px solid #1a2234", display: "flex", alignItems: "center", justifyContent: "space-between" },
    body: { padding: "24px" },
    label: { fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 6 } as const,
    hint: { fontSize: 11, color: "#475569", marginTop: 4 } as const,
    input: { width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" as const },
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>

        <div style={s.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-adjustments" style={{ fontSize: 16, color: "#60a5fa" }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>Update Policy</span>
            <span style={{ fontSize: 11, color: "#60a5fa", background: "#1a2d4a", border: "1px solid #2563eb", padding: "2px 8px", borderRadius: 4 }}>
              Policy v1.0 → v1.1
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <i className="ti ti-x" style={{ fontSize: 16 }} />
          </button>
        </div>

        <div style={s.body}>

          <div style={{ background: "#080c14", border: "1px solid #22c55e", borderRadius: 8, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <i className="ti ti-check" style={{ fontSize: 13, color: "#22c55e", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
              These parameters can be updated on-chain without redeploying. Policy version increments automatically. All changes are logged in the activity log.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={s.label}>Risk Ceiling</label>
                <span style={{ fontSize: 13, fontWeight: 600, color: riskColor }}>{riskCeiling} / 100</span>
              </div>
              <input
                type="range" min={10} max={100} value={riskCeiling}
                onChange={(e) => setRiskCeiling(Number(e.target.value))}
                style={{ width: "100%", accentColor: riskColor }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <p style={s.hint}>Agent pauses above this score. Current: {agent.riskCeiling} / 100</p>
                <p style={{ ...s.hint, color: riskCeiling !== agent.riskCeiling ? "#f59e0b" : "#475569" }}>
                  {riskCeiling !== agent.riskCeiling ? `Changed from ${agent.riskCeiling}` : "No change"}
                </p>
              </div>
            </div>

            {isTrading && (
              <div>
                <label style={s.label}>Slippage Guard</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number" step={0.1} min={0.1} max={10}
                    value={(slippageBps / 100).toFixed(1)}
                    onChange={(e) => setSlippageBps(Math.round(Number(e.target.value) * 100))}
                    style={{ ...s.input, flex: 1 }}
                  />
                  <div style={{ display: "flex", alignItems: "center", padding: "0 14px", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 13, color: "#64748b" }}>%</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <p style={s.hint}>Trade skipped if slippage exceeds this. Current: {(agent.slippageGuardBps / 100).toFixed(1)}%</p>
                  <p style={{ ...s.hint, color: slippageBps !== agent.slippageGuardBps ? "#f59e0b" : "#475569" }}>
                    {slippageBps !== agent.slippageGuardBps ? `Changed from ${(agent.slippageGuardBps / 100).toFixed(1)}%` : "No change"}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label style={s.label}>Max Single Transaction</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number" min={1} max={agent.budget}
                  value={maxTx}
                  onChange={(e) => setMaxTx(Number(e.target.value))}
                  style={{ ...s.input, flex: 1 }}
                />
                <div style={{ display: "flex", alignItems: "center", padding: "0 14px", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 13, color: "#64748b" }}>
                  {agent.token}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={s.hint}>Hard ceiling per action. Max: {agent.budget} {agent.token}. Current: {agent.maxSingleTx} {agent.token}</p>
                <p style={{ ...s.hint, color: maxTx !== agent.maxSingleTx ? "#f59e0b" : "#475569" }}>
                  {maxTx !== agent.maxSingleTx ? `Changed from ${agent.maxSingleTx}` : "No change"}
                </p>
              </div>
            </div>
          </div>

          <div style={{ background: "#080c14", border: "1px solid #1a2234", borderRadius: 10, padding: "14px", marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Locked — Cannot change without redeployment</p>
            {[
              { label: "Budget", value: `${agent.budget} ${agent.token}` },
              { label: "Token", value: agent.token },
              { label: "Scope", value: agent.scope },
              { label: "Agent Type", value: agent.agentType },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-lock" style={{ fontSize: 11, color: "#334155" }} />
                  <span style={{ fontSize: 12, color: "#334155" }}>{row.label}</span>
                </div>
                <span style={{ fontSize: 12, color: "#475569" }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid #1e2d45", color: "#94a3b8", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved || (riskCeiling === agent.riskCeiling && slippageBps === agent.slippageGuardBps && maxTx === agent.maxSingleTx)}
              style={{
                flex: 2, padding: "11px 0",
                background: saved ? "#166534" : saving ? "#1a2d4a" : (riskCeiling === agent.riskCeiling && slippageBps === agent.slippageGuardBps && maxTx === agent.maxSingleTx) ? "#1e2837" : "#2563eb",
                color: saved ? "#22c55e" : saving ? "#60a5fa" : (riskCeiling === agent.riskCeiling && slippageBps === agent.slippageGuardBps && maxTx === agent.maxSingleTx) ? "#475569" : "#fff",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: saving || saved ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}
            >
              {saved ? (
                <><i className="ti ti-check" style={{ fontSize: 14 }} /> Policy Updated — v1.1</>
              ) : saving ? (
                <><i className="ti ti-loader-2" style={{ fontSize: 14 }} /> Writing to Sui...</>
              ) : (
                <><i className="ti ti-upload" style={{ fontSize: 14 }} /> Update On-chain</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
