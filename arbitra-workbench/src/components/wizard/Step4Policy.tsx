"use client";

import { useState } from "react";
import { WizardState, agentTypeConfig, templateConfigs } from "@/lib/wizardState";
import { agentPolicyConfig, paymentScheduleOptions, subscriptionIntervalOptions } from "@/lib/policyConfig";

const tokens = ["USDC", "USDT", "DEEP", "SUI"];
const tradingPairs = ["SUI/USDC", "SUI/USDT", "DEEP/USDC", "SUI/DEEP"];
const expiryOptions = [
  { label: "1 hour", value: "1" },
  { label: "6 hours", value: "6" },
  { label: "12 hours", value: "12" },
  { label: "24 hours", value: "24" },
  { label: "3 days", value: "72" },
  { label: "7 days", value: "168" },
  { label: "30 days", value: "720" },
  { label: "Never", value: "0" },
];
const templates = ["conservative", "balanced", "aggressive", "custom"] as const;

const inputStyle = { width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" };
const labelStyle = { fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 6 } as const;
const hintStyle = { fontSize: 11, color: "#475569", marginTop: 4 } as const;

interface Step4Props {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function Step4Policy({ state, onChange, onContinue, onBack }: Step4Props) {
  const [sdkOpen, setSdkOpen] = useState(true);
  const agentType = state.agentType ?? "custom";
  const typeConfig = agentTypeConfig[agentType];
  const policyConf = agentPolicyConfig[agentType];
  const expiryLabel = expiryOptions.find(e => e.value === state.expiry)?.label ?? "24 hours";

  const applyTemplate = (t: typeof templates[number]) => {
    if (t === "custom") { onChange({ template: "custom" }); return; }
    onChange({ template: t, ...templateConfigs[t] });
  };

  const addSplitAddress = () => onChange({ splitAddresses: [...state.splitAddresses, { address: "", amount: 0 }] });
  const removeSplitAddress = (i: number) => onChange({ splitAddresses: state.splitAddresses.filter((_, idx) => idx !== i) });
  const updateSplitAddress = (i: number, field: "address" | "amount", value: string | number) => {
    const updated = [...state.splitAddresses];
    updated[i] = { ...updated[i], [field]: value };
    onChange({ splitAddresses: updated });
  };

  const addRecipient = () => onChange({ recipientWhitelist: [...state.recipientWhitelist, ""] });
  const removeRecipient = (i: number) => onChange({ recipientWhitelist: state.recipientWhitelist.filter((_, idx) => idx !== i) });
  const updateRecipient = (i: number, value: string) => {
    const updated = [...state.recipientWhitelist];
    updated[i] = value;
    onChange({ recipientWhitelist: updated });
  };

  const sdkCode = `const agent = await Arbitra.createPolicy({
  type: "${agentType}",
  budget: ${state.budget},
  token: "${state.token}",${policyConf.showTradingPair ? `\n  pair: "${state.tradingPair}",` : ""}
  scope: "${state.scope}",
  expiry: "${state.expiry === "0" ? "never" : state.expiry + "h"}",
  riskCeiling: ${state.riskCeiling},${policyConf.showSlippage ? `\n  slippageGuard: ${state.slippageGuardBps / 100},` : ""}
  maxTx: ${state.maxSingleTx},${policyConf.showSubscription && state.subscriptionEnabled ? `\n  subscription: { amount: ${state.subscriptionAmount}, interval: "${state.subscriptionInterval}" },` : ""}
})`;

  const SectionDivider = ({ label }: { label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
      <div style={{ flex: 1, height: 1, background: "#1e2d45" }} />
      <span style={{ fontSize: 11, color: "#475569" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#1e2d45" }} />
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f1f5f9", marginBottom: 8 }}>Set your agent's policy.</h2>
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, maxWidth: 480, margin: "0 auto 14px" }}>
            These rules will be written to Sui as a Move object. Your agent cannot override them once deployed.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 8, padding: "6px 16px", fontSize: 13, color: "#94a3b8" }}>
            <i className={`ti ${typeConfig.icon}`} style={{ fontSize: 14, color: typeConfig.color }} />
            <span>{typeConfig.label}</span>
            <span style={{ color: "#334155" }}>·</span>
            <span>{state.agentName || "My Agent"}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>Start from a template:</span>
          <div style={{ display: "flex", gap: 6 }}>
            {templates.map(t => (
              <button key={t} onClick={() => applyTemplate(t)}
                style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${state.template === t ? "#2563eb" : "#1e2d45"}`, background: state.template === t ? "#1a2d4a" : "transparent", color: state.template === t ? "#60a5fa" : "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={labelStyle}>{policyConf.budgetLabel} <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" value={state.budget} onChange={(e) => onChange({ budget: Number(e.target.value), template: "custom" })}
                  style={{ ...inputStyle, flex: 1 }} />
                <select value={state.token} onChange={(e) => onChange({ token: e.target.value })}
                  style={{ ...inputStyle, width: 90 }}>
                  {tokens.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <p style={hintStyle}>Maximum total the agent can spend. Cannot be exceeded at the VM level.</p>
            </div>

            {policyConf.showTradingPair && (
              <div>
                <label style={labelStyle}>Trading Pair <span style={{ color: "#ef4444" }}>*</span></label>
                <select value={state.tradingPair} onChange={(e) => onChange({ tradingPair: e.target.value })} style={inputStyle}>
                  {tradingPairs.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            )}

            {policyConf.showWeeklyReset && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "12px 14px" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", marginBottom: 2 }}>Weekly Budget Reset</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>Budget resets every 7 days instead of total lifetime</div>
                </div>
                <div onClick={() => onChange({ weeklyReset: !state.weeklyReset })}
                  style={{ width: 36, height: 20, borderRadius: 10, background: state.weeklyReset ? "#2563eb" : "#1e2d45", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 2, left: state.weeklyReset ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Expiry <span style={{ color: "#ef4444" }}>*</span></label>
              <select value={state.expiry} onChange={(e) => onChange({ expiry: e.target.value, template: "custom" })} style={inputStyle}>
                {expiryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <p style={hintStyle}>Agent self-terminates after this period. No action required from you.</p>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Risk Ceiling <span style={{ color: "#ef4444" }}>*</span></label>
              <span style={{ fontSize: 13, fontWeight: 600, color: state.riskCeiling > 74 ? "#ef4444" : state.riskCeiling > 49 ? "#f59e0b" : "#60a5fa" }}>
                {state.riskCeiling} / 100
              </span>
            </div>
            <input type="range" min={10} max={100} value={state.riskCeiling}
              onChange={(e) => onChange({ riskCeiling: Number(e.target.value), template: "custom" })}
              style={{ width: "100%", accentColor: state.riskCeiling > 74 ? "#ef4444" : state.riskCeiling > 49 ? "#f59e0b" : "#2563eb" }} />
            <p style={hintStyle}>Agent pauses itself above this score. Resumes automatically when safe.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {policyConf.showSlippage && (
              <div>
                <label style={labelStyle}>Slippage Guard</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="number" value={state.slippageGuardBps / 100} step={0.1}
                    onChange={(e) => onChange({ slippageGuardBps: Math.round(Number(e.target.value) * 100), template: "custom" })}
                    style={{ ...inputStyle, flex: 1 }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 13, color: "#64748b" }}>%</div>
                </div>
                <p style={hintStyle}>Trade is skipped if slippage exceeds this.</p>
              </div>
            )}

            <div>
              <label style={labelStyle}>{policyConf.maxTxLabel}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" value={state.maxSingleTx}
                  onChange={(e) => onChange({ maxSingleTx: Number(e.target.value), template: "custom" })}
                  style={{ ...inputStyle, flex: 1 }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 13, color: "#64748b" }}>{state.token}</div>
              </div>
              <p style={hintStyle}>Hard ceiling per individual action.</p>
            </div>
          </div>

          {policyConf.showDeepbookToggle && (
            <div>
              <label style={labelStyle}>{policyConf.scopeLabel} <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div onClick={() => onChange({ scope: "deepbook" })}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${state.scope === "deepbook" ? "#2563eb" : "#475569"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {state.scope === "deepbook" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />}
                    </div>
                    <span style={{ fontSize: 13, color: "#f1f5f9" }}>Deepbook</span>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 10, background: state.scope === "deepbook" ? "#2563eb" : "#1e2d45", position: "relative", cursor: "pointer" }}>
                    <div style={{ position: "absolute", top: 2, left: state.scope === "deepbook" ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </div>
                </div>
                <div onClick={() => onChange({ scope: "custom" })}
                  style={{ background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: state.scope === "custom" ? 8 : 0 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${state.scope === "custom" ? "#2563eb" : "#475569"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {state.scope === "custom" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />}
                    </div>
                    <span style={{ fontSize: 13, color: "#f1f5f9" }}>Custom Protocol Address</span>
                  </div>
                  {state.scope === "custom" && (
                    <input value={state.customScopeAddress} onChange={(e) => onChange({ customScopeAddress: e.target.value })}
                      placeholder="0x..." onClick={(e) => e.stopPropagation()}
                      style={{ width: "100%", background: "#0b0f18", border: "1px solid #1e2d45", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                  )}
                </div>
              </div>
            </div>
          )}

          {policyConf.showVendorAddress && (
            <div>
              <label style={labelStyle}>{policyConf.scopeLabel} <span style={{ color: "#ef4444" }}>*</span></label>
              <input value={state.customScopeAddress} onChange={(e) => onChange({ customScopeAddress: e.target.value })}
                placeholder="0x... or vendor.sui" style={inputStyle} />
              <p style={hintStyle}>Agent can only send funds to this address.</p>
            </div>
          )}

          {policyConf.showSplitAddresses && (
            <div>
              <SectionDivider label="Split Payments" />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9" }}>Split Payment Addresses</span>
                {policyConf.streamComingSoon && (
                  <span style={{ fontSize: 11, color: "#475569", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 4, padding: "2px 6px" }}>
                    Stream — coming soon
                  </span>
                )}
              </div>
              <p style={{ ...hintStyle, marginBottom: 12 }}>Divide payments across multiple addresses simultaneously.</p>
              {(state.splitAddresses ?? []).map((split, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={split.address} onChange={(e) => updateSplitAddress(i, "address", e.target.value)}
                    placeholder="0x... recipient address"
                    style={{ ...inputStyle, flex: 2 }} />
                  <input type="number" value={split.amount || ""} onChange={(e) => updateSplitAddress(i, "amount", Number(e.target.value))}
                    placeholder="Amount"
                    style={{ ...inputStyle, flex: 1 }} />
                  <div style={{ display: "flex", alignItems: "center", padding: "0 10px", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 12, color: "#64748b", flexShrink: 0 }}>{state.token}</div>
                  {state.splitAddresses.length > 1 && (
                    <button onClick={() => removeSplitAddress(i)}
                      style={{ width: 36, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid #1e2d45", borderRadius: 8, cursor: "pointer", color: "#64748b", flexShrink: 0 }}>
                      <i className="ti ti-x" style={{ fontSize: 12 }} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addSplitAddress}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px dashed #1e2d45", color: "#64748b", padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", marginTop: 4 }}>
                <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add Recipient
              </button>
            </div>
          )}

          {policyConf.showRecipientWhitelist && (
            <div>
              <SectionDivider label="Recipient Whitelist" />
              <label style={labelStyle}>Approved Recipients <span style={{ color: "#ef4444" }}>*</span></label>
              <p style={{ ...hintStyle, marginBottom: 12 }}>Agent can only send funds to these addresses.</p>
              {(state.recipientWhitelist ?? []).map((addr, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={addr} onChange={(e) => updateRecipient(i, e.target.value)}
                    placeholder="0x... or recipient.sui"
                    style={{ ...inputStyle, flex: 1 }} />
                  {state.recipientWhitelist.length > 1 && (
                    <button onClick={() => removeRecipient(i)}
                      style={{ width: 36, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid #1e2d45", borderRadius: 8, cursor: "pointer", color: "#64748b" }}>
                      <i className="ti ti-x" style={{ fontSize: 12 }} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addRecipient}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px dashed #1e2d45", color: "#64748b", padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add Address
              </button>
            </div>
          )}

          {policyConf.showPaymentSchedule && (
            <div>
              <SectionDivider label="Payment Schedule" />
              <label style={labelStyle}>Payment Schedule</label>
              <select value={state.paymentSchedule} onChange={(e) => onChange({ paymentSchedule: e.target.value })} style={inputStyle}>
                {paymentScheduleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          {policyConf.showMarketplaceAddress && (
            <div>
              <label style={labelStyle}>Approved Marketplace Address <span style={{ color: "#ef4444" }}>*</span></label>
              <input value={state.marketplaceAddress} onChange={(e) => onChange({ marketplaceAddress: e.target.value })}
                placeholder="0x... marketplace contract" style={inputStyle} />
              <p style={hintStyle}>Agent can only interact with this marketplace contract.</p>
            </div>
          )}

          {policyConf.showSubscription && (
            <div>
              <SectionDivider label="Recurring Payment" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "12px 14px", marginBottom: state.subscriptionEnabled ? 16 : 0 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", marginBottom: 2 }}>Recurring Payment</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>Fixed amount sent to recipient on a schedule</div>
                </div>
                <div onClick={() => onChange({ subscriptionEnabled: !state.subscriptionEnabled })}
                  style={{ width: 36, height: 20, borderRadius: 10, background: state.subscriptionEnabled ? "#2563eb" : "#1e2d45", position: "relative", cursor: "pointer", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 2, left: state.subscriptionEnabled ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </div>
              </div>
              {state.subscriptionEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Amount per Cycle</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input type="number" value={state.subscriptionAmount || ""}
                          onChange={(e) => onChange({ subscriptionAmount: Number(e.target.value) })}
                          placeholder="0" style={{ ...inputStyle, flex: 1 }} />
                        <div style={{ display: "flex", alignItems: "center", padding: "0 10px", background: "#0b0f18", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 12, color: "#64748b" }}>{state.token}</div>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Interval</label>
                      <select value={state.subscriptionInterval} onChange={(e) => onChange({ subscriptionInterval: e.target.value })} style={inputStyle}>
                        {subscriptionIntervalOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Recipient Address</label>
                      <input value={state.subscriptionRecipient} onChange={(e) => onChange({ subscriptionRecipient: e.target.value })}
                        placeholder="0x..." style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Start Date</label>
                      <input type="datetime-local" value={state.subscriptionStartDate}
                        onChange={(e) => onChange({ subscriptionStartDate: e.target.value })}
                        style={{ ...inputStyle, colorScheme: "dark" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>End Date <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span></label>
                      <input type="datetime-local" value={state.subscriptionEndDate}
                        onChange={(e) => onChange({ subscriptionEndDate: e.target.value })}
                        style={{ ...inputStyle, colorScheme: "dark" }} />
                      <p style={hintStyle}>Leave empty to run until policy is revoked.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {policyConf.showBeneficiary && (
              <div>
                <label style={labelStyle}>Treasury Address <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span></label>
                <input value={state.beneficiaryAddress} onChange={(e) => onChange({ beneficiaryAddress: e.target.value })}
                  placeholder="0x..." style={inputStyle} />
                <p style={hintStyle}>Where remaining funds go when the policy expires or is revoked.</p>
              </div>
            )}
            <div>
              <label style={labelStyle}>
                DAO Override Address
                <span style={{ color: policyConf.daoOverrideRequired ? "#ef4444" : "#475569", fontWeight: 400 }}>
                  {policyConf.daoOverrideRequired ? " *" : " (optional)"}
                </span>
              </label>
              <input value={state.daoOverrideAddress} onChange={(e) => onChange({ daoOverrideAddress: e.target.value })}
                placeholder="0x..." style={inputStyle} />
              <p style={hintStyle}>Second wallet that can override a policy pause without full revocation.</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          <button onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid #1e2d45", color: "#94a3b8", padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} /> Back
          </button>
          <button onClick={onContinue}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", border: "none", padding: "10px 28px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Continue <i className="ti ti-arrow-right" style={{ fontSize: 14 }} />
          </button>
        </div>
      </div>

      <div style={{ width: 280, background: "#080c14", borderLeft: "1px solid #1a2234", overflowY: "auto", padding: "24px 20px", flexShrink: 0 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <i className="ti ti-file-description" style={{ fontSize: 15, color: "#60a5fa" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>Policy Summary</span>
          </div>
          {[
            { label: "Agent Type", value: typeConfig.label },
            { label: "Agent Name", value: state.agentName || "—" },
            { label: policyConf.budgetLabel, value: `${state.budget} ${state.token}` },
            policyConf.showTradingPair ? { label: "Trading Pair", value: state.tradingPair } : null,
            { label: "Scope", value: state.scope === "deepbook" ? "Deepbook" : "Custom" },
            { label: "Expiry", value: expiryLabel },
            { label: "Risk Ceiling", value: `${state.riskCeiling} / 100` },
            policyConf.showSlippage ? { label: "Slippage Guard", value: `${state.slippageGuardBps / 100}%` } : null,
            { label: policyConf.maxTxLabel, value: `${state.maxSingleTx} ${state.token}` },
            policyConf.showWeeklyReset ? { label: "Weekly Reset", value: state.weeklyReset ? "Yes" : "No" } : null,
            policyConf.showPaymentSchedule ? { label: "Schedule", value: state.paymentSchedule } : null,
            policyConf.showSubscription && state.subscriptionEnabled ? { label: "Subscription", value: `${state.subscriptionAmount} ${state.token} / ${state.subscriptionInterval}` } : null,
            { label: "Treasury", value: state.beneficiaryAddress ? state.beneficiaryAddress.slice(0, 8) + "..." : "Not set" },
            { label: "DAO Override", value: state.daoOverrideAddress ? state.daoOverrideAddress.slice(0, 8) + "..." : policyConf.daoOverrideRequired ? "Required" : "Not set" },
          ].filter(Boolean).map((row: any) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
              <span style={{ fontSize: 12, color: "#475569", flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: 12, color: row.label === "DAO Override" && policyConf.daoOverrideRequired && !state.daoOverrideAddress ? "#ef4444" : "#94a3b8", textAlign: "right" }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "#0e1623", border: "1px solid #d97706", borderRadius: 8, padding: "10px 12px", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 14, color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
            Budget and Scope cannot be changed after deployment without full policy redeployment.
          </p>
        </div>

        <div style={{ background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 12px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <i className="ti ti-info-circle" style={{ fontSize: 14, color: "#60a5fa", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
            Risk Ceiling, Slippage Guard, and Max Tx can be updated on-chain without redeployment.
          </p>
        </div>

        <button onClick={() => setSdkOpen(!sdkOpen)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", marginBottom: 10, padding: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-code" style={{ fontSize: 14, color: "#60a5fa" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>SDK Preview</span>
          </div>
          <i className={`ti ti-chevron-${sdkOpen ? "up" : "down"}`} style={{ fontSize: 14, color: "#475569" }} />
        </button>
        <p style={{ fontSize: 11, color: "#475569", marginBottom: 10 }}>This is what Arbitra generates from your config</p>
        {sdkOpen && (
          <div style={{ background: "#060a10", border: "1px solid #1a2234", borderRadius: 8, padding: "12px", position: "relative" }}>
            <pre style={{ fontSize: 11, color: "#60a5fa", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, fontFamily: "monospace" }}>
              {sdkCode}
            </pre>
            <button onClick={() => navigator.clipboard.writeText(sdkCode)}
              style={{ position: "absolute", top: 8, right: 8, background: "transparent", border: "1px solid #1e2d45", borderRadius: 4, padding: "3px 8px", fontSize: 11, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <i className="ti ti-copy" style={{ fontSize: 11 }} /> Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
