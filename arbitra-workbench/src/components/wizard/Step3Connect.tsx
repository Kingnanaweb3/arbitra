"use client";

import { useState } from "react";
import { WizardState, agentDemoConfig, ALL_AEGIS_ACTION_TYPES } from "@/lib/wizardState";

interface Step3Props {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function Step3Connect({ state, onChange, onContinue, onBack }: Step3Props) {
  const [testing, setTesting] = useState(false);
  const agentType = state.agentType ?? "custom";
  const demoConf = agentDemoConfig[agentType];

  const handleTestConnection = async () => {
    if (!state.endpointUrl) return;
    setTesting(true);
    onChange({ connectionStatus: "testing" });
    try {
      const res = await fetch(state.endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ping" }),
        signal: AbortSignal.timeout(5000),
      });
      onChange({ connectionStatus: res.ok ? "connected" : "failed" });
    } catch {
      onChange({ connectionStatus: "failed" });
    }
    setTesting(false);
  };

  const addMapping = () => {
    onChange({ actionMappings: [...state.actionMappings, { agentAction: "", arbitraType: "BUY" }] });
  };

  const removeMapping = (index: number) => {
    onChange({ actionMappings: state.actionMappings.filter((_, i) => i !== index) });
  };

  const updateMapping = (index: number, field: "agentAction" | "arbitraType", value: string) => {
    const updated = [...state.actionMappings];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ actionMappings: updated });
  };

  const statusColor = { idle: "#475569", testing: "#f59e0b", connected: "#22c55e", failed: "#ef4444" }[state.connectionStatus];
  const statusLabel = { idle: "", testing: "Testing...", connected: "Connected", failed: "Failed — check URL and auth" }[state.connectionStatus];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "40px", overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 680 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f1f5f9", marginBottom: 8 }}>Connect your agent.</h2>
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
            How will your agent send actions to Arbitra? Choose one option below.
          </p>
          {state.agentName && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 8, padding: "6px 14px", marginTop: 12 }}>
              <i className={`ti ${state.agentIcon}`} style={{ fontSize: 14, color: "#60a5fa" }} />
              <span style={{ fontSize: 13, color: "#94a3b8" }}>{state.agentName}</span>
              {state.agentType && (
                <span style={{ fontSize: 11, color: "#475569", background: "#080c14", border: "1px solid #1a2234", borderRadius: 4, padding: "2px 6px" }}>
                  {state.agentType}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          <button
            onClick={() => onChange({ connectionType: "own" })}
            style={{ flex: 1, background: state.connectionType === "own" ? "#0f1e36" : "#0e1623", border: `1px solid ${state.connectionType === "own" ? "#2563eb" : "#1e2d45"}`, borderRadius: 10, padding: "16px", textAlign: "left", cursor: "pointer", color: "#f1f5f9" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <i className="ti ti-plug-connected" style={{ fontSize: 16, color: state.connectionType === "own" ? "#60a5fa" : "#64748b" }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Connect My Own Agent</span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>I have an existing AI agent with an API endpoint.</p>
            <p style={{ fontSize: 11, color: state.connectionType === "own" ? "#60a5fa" : "#475569", marginTop: 6 }}>Best for: developers with existing agents</p>
          </button>

          <button
            onClick={() => onChange({ connectionType: "demo" })}
            style={{ flex: 1, background: state.connectionType === "demo" ? "#0f1e36" : "#0e1623", border: `1px solid ${state.connectionType === "demo" ? "#2563eb" : "#1e2d45"}`, borderRadius: 10, padding: "16px", textAlign: "left", cursor: "pointer", color: "#f1f5f9" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <i className="ti ti-bolt" style={{ fontSize: 16, color: state.connectionType === "demo" ? "#60a5fa" : "#64748b" }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Use Built-in Demo Agent</span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>Use Arbitra pre-built agent on Sui testnet. No setup needed.</p>
            <p style={{ fontSize: 11, color: state.connectionType === "demo" ? "#60a5fa" : "#475569", marginTop: 6 }}>Best for: exploring Arbitra without an existing agent</p>
          </button>
        </div>

        {state.connectionType === "own" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 6 }}>
                Agent Endpoint URL <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                value={state.endpointUrl}
                onChange={(e) => onChange({ endpointUrl: e.target.value, connectionStatus: "idle" })}
                placeholder="https://your-agent.com/action"
                style={{ width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }}
              />
              <p style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Arbitra sends action requests here before every execution</p>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 6 }}>Auth Type</label>
                <select value={state.authType} onChange={(e) => onChange({ authType: e.target.value as any })}
                  style={{ width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                  <option value="bearer">Bearer Token</option>
                  <option value="apikey">API Key</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 6 }}>Auth Header Key</label>
                <input value={state.authKey} onChange={(e) => onChange({ authKey: e.target.value })} placeholder="Authorization"
                  style={{ width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 6 }}>Auth Value</label>
                <input value={state.authValue} onChange={(e) => onChange({ authValue: e.target.value })} placeholder="Bearer xxxxx" type="password"
                  style={{ width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={handleTestConnection} disabled={!state.endpointUrl || testing}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid #1e2d45", color: "#94a3b8", padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: state.endpointUrl ? "pointer" : "not-allowed" }}>
                <i className="ti ti-plug-connected" style={{ fontSize: 14 }} />
                {testing ? "Testing..." : "Test Connection"}
              </button>
              {state.connectionStatus !== "idle" && (
                <span style={{ fontSize: 12, color: statusColor, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, display: "inline-block" }} />
                  {statusLabel}
                </span>
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: "#1e2d45" }} />
                <span style={{ fontSize: 12, color: "#475569" }}>Map Action Types</span>
                <div style={{ flex: 1, height: 1, background: "#1e2d45" }} />
              </div>
              <p style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>{demoConf.actionNote}</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, padding: "0 4px" }}>
                <span style={{ flex: 1, fontSize: 11, color: "#64748b", fontWeight: 500 }}>Your Agent Action</span>
                <span style={{ width: 20 }} />
                <span style={{ flex: 1, fontSize: 11, color: "#64748b", fontWeight: 500 }}>Arbitra Type</span>
                <span style={{ width: 28 }} />
              </div>
              {state.actionMappings.map((mapping, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <input value={mapping.agentAction} onChange={(e) => updateMapping(i, "agentAction", e.target.value)} placeholder="your action label"
                    style={{ flex: 1, background: "#080c14", border: "1px solid #1e2d45", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                  <i className="ti ti-arrow-right" style={{ fontSize: 14, color: "#475569" }} />
                  <select value={mapping.arbitraType} onChange={(e) => updateMapping(i, "arbitraType", e.target.value)}
                    style={{ flex: 1, background: "#080c14", border: "1px solid #1e2d45", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                    {ALL_AEGIS_ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => removeMapping(i)}
                    style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid #1e2d45", borderRadius: 6, cursor: "pointer", color: "#64748b" }}>
                    <i className="ti ti-x" style={{ fontSize: 12 }} />
                  </button>
                </div>
              ))}
              <button onClick={addMapping}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px dashed #1e2d45", color: "#64748b", padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", marginTop: 4 }}>
                <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add Action Type
              </button>
            </div>
          </div>
        )}

        {state.connectionType === "demo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 12, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <i className="ti ti-bolt" style={{ fontSize: 16, color: "#60a5fa" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>{demoConf.label}</span>
            </div>

            {demoConf.showTradingConfig && (
              <>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 10 }}>Strategy</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {demoConf.strategies?.map(s => (
                      <button key={s} onClick={() => onChange({ strategy: s as any })}
                        style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${state.strategy === s ? "#2563eb" : "#1e2d45"}`, background: state.strategy === s ? "#1a2d4a" : "transparent", color: state.strategy === s ? "#60a5fa" : "#64748b", fontSize: 13, cursor: "pointer" }}>
                        {s === "dca" ? "DCA" : "Momentum"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 8 }}>Trading Pair</label>
                  <select value={state.tradingPair} onChange={(e) => onChange({ tradingPair: e.target.value })}
                    style={{ width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                    {demoConf.tradingPairs?.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 8 }}>Execution Interval</label>
                  <select value={state.executionInterval} onChange={(e) => onChange({ executionInterval: e.target.value })}
                    style={{ width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                    {demoConf.intervals?.map(i => <option key={i} value={i}>Every {i} minutes</option>)}
                  </select>
                </div>
              </>
            )}

            {demoConf.showVendorInput && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 8 }}>Approved Vendor Address</label>
                <input placeholder="vendor.sui or 0x..." 
                  style={{ width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                <p style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Add at least one approved vendor address</p>
              </div>
            )}

            {demoConf.showPaymentSchedule && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 8 }}>Payment Schedule</label>
                <select style={{ width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                  {demoConf.schedules?.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            )}

            {demoConf.showMarketplaceInput && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 8 }}>Approved Marketplace Address</label>
                <input placeholder="marketplace.sui or 0x..."
                  style={{ width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
              </div>
            )}

            {(!demoConf.showTradingConfig && !demoConf.showVendorInput && !demoConf.showPaymentSchedule && !demoConf.showMarketplaceInput) && (
              <div>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
                  Configure your action types below. Define what labels your agent will send and map them to Arbitra enforcement types.
                </p>
                {state.actionMappings.map((mapping, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <input value={mapping.agentAction} onChange={(e) => updateMapping(i, "agentAction", e.target.value)} placeholder="your action label"
                      style={{ flex: 1, background: "#080c14", border: "1px solid #1e2d45", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                    <i className="ti ti-arrow-right" style={{ fontSize: 14, color: "#475569" }} />
                    <select value={mapping.arbitraType} onChange={(e) => updateMapping(i, "arbitraType", e.target.value)}
                      style={{ flex: 1, background: "#080c14", border: "1px solid #1e2d45", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                      {ALL_AEGIS_ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={() => removeMapping(i)}
                      style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid #1e2d45", borderRadius: 6, cursor: "pointer", color: "#64748b" }}>
                      <i className="ti ti-x" style={{ fontSize: 12 }} />
                    </button>
                  </div>
                ))}
                <button onClick={addMapping}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px dashed #1e2d45", color: "#64748b", padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", marginTop: 4 }}>
                  <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add Action Type
                </button>
              </div>
            )}

            <div style={{ background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <i className="ti ti-info-circle" style={{ fontSize: 15, color: "#60a5fa", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                This agent runs on Sui testnet. No real funds are used. All actions are logged on-chain.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          <button onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid #1e2d45", color: "#94a3b8", padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} /> Back
          </button>
          <button onClick={() => {
            if (state.connectionType === "own" && !state.endpointUrl.trim()) {
              alert("Please enter your agent endpoint URL to continue.");
              return;
            }
            onContinue();
          }} disabled={!state.connectionType}
            style={{ display: "flex", alignItems: "center", gap: 8, background: state.connectionType ? "#2563eb" : "#1e2837", color: state.connectionType ? "#fff" : "#475569", border: "none", padding: "10px 28px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: state.connectionType ? "pointer" : "not-allowed" }}>
            Continue <i className="ti ti-arrow-right" style={{ fontSize: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}
