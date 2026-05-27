"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getAgent, getAgents, DeployedAgent } from "@/lib/agentStore";
import { getDashboardConfig, getMockLogs, getMockStats, MockLogEntry } from "@/lib/dashboardConfig";
import UpdatePolicyModal from "@/components/dashboard/UpdatePolicyModal";
import { agentTypeConfig } from "@/lib/wizardState";

const statusColors: Record<string, string> = {
  approved: "#60a5fa",
  rejected: "#ef4444",
  warning: "#f59e0b",
  paused: "#f59e0b",
  system: "#64748b",
};

const statusDot: Record<string, string> = {
  approved: "#60a5fa",
  rejected: "#ef4444",
  warning: "#f59e0b",
  paused: "#f59e0b",
  system: "#475569",
};

export default function AgentDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const account = useCurrentAccount();
  const policyId = params.policyId as string;

  const [agent, setAgent] = useState<DeployedAgent | null>(null);
  const [allAgents, setAllAgents] = useState<DeployedAgent[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [showUpdatePolicy, setShowUpdatePolicy] = useState(false);
  const [showUpdateRisk, setShowUpdateRisk] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [gaugeValue, setGaugeValue] = useState(44);
  const [logs, setLogs] = useState<MockLogEntry[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [stressMessage, setStressMessage] = useState("");
  const [blockNumber, setBlockNumber] = useState("4,821,903");
  const [sdkOpen, setSdkOpen] = useState(false);
  const [latency, setLatency] = useState(98);

  useEffect(() => {
    const found = getAgent(policyId);
    const all = getAgents();
    setAgent(found);
    setAllAgents(all);
    if (found) {
      const agentType = found.agentType;
      const mockLogs = getMockLogs(agentType, found.token);
      const seen = new Set();
      const unique = mockLogs.filter(l => {
        const key = l.time + l.action + l.amount;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setLogs(unique);
      setStats(getMockStats(agentType, found.budget, found.token));
      setGaugeValue(agentType === "trading" ? 44 : 72);
    }
  }, [policyId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlockNumber(prev => (Number(prev.replace(/,/g, "")) + Math.floor(Math.random() * 3 + 1)).toLocaleString());
      setLatency(Math.floor(Math.random() * 40 + 80));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStressTest = async () => {
    if (isStressTesting || isPaused) return;
    setIsStressTesting(true);
    setStressMessage("Risk spike detected — risk score climbing...");

    for (let i = gaugeValue; i <= 90; i += 5) {
      await new Promise(r => setTimeout(r, 100));
      setGaugeValue(i);
    }

    setIsPaused(true);
    setStressMessage("Risk ceiling breached. Agent paused automatically.");
    setLogs(prev => [{
      time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      action: "PAUSED",
      amount: 0,
      token: agent?.token ?? "USDC",
      target: "Risk spike",
      status: "paused",
      reason: "Risk score 90 > ceiling 75",
      policyVersion: "v1.0",
    }, ...prev]);

    await new Promise(r => setTimeout(r, 4000));
    setStressMessage("Conditions normalizing — risk score dropping...");

    for (let i = 90; i >= 61; i -= 5) {
      await new Promise(r => setTimeout(r, 100));
      setGaugeValue(i);
    }

    setIsPaused(false);
    setStressMessage("Risk normalized. Agent resumed automatically.");
    setLogs(prev => [{
      time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      action: "RESUMED",
      amount: 0,
      token: agent?.token ?? "USDC",
      target: "Risk normalized",
      status: "approved",
      reason: "Risk score 61 < ceiling 75",
      policyVersion: "v1.0",
    }, ...prev]);

    await new Promise(r => setTimeout(r, 3000));
    setStressMessage("");
    setIsStressTesting(false);
  };

  if (!agent) {
    return (
      <div style={{ height: "100vh", background: "#060a10", color: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
        <div style={{ textAlign: "center" }}>
          <i className="ti ti-shield-bolt" style={{ fontSize: 40, color: "#60a5fa", display: "block", marginBottom: 16 }} />
          <p style={{ color: "#94a3b8", marginBottom: 16 }}>Agent not found</p>
          <button onClick={() => router.push("/")} style={{ background: "transparent", border: "1px solid #1e2d45", color: "#60a5fa", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const conf = getDashboardConfig(agent.agentType);
  const typeConfig = (agentTypeConfig as any)[agent.agentType] ?? agentTypeConfig.custom;
  const isTrading = agent.agentType === "trading";
  const gaugeColor = gaugeValue > 74 ? "#ef4444" : gaugeValue > 49 ? "#f59e0b" : "#22c55e";
  const gaugePercent = Math.min(gaugeValue / 100, 1);
  const getDisplayStatus = (l: MockLogEntry) => {
    if (l.status === "approved") return "logged";
    if (l.status === "paused") return "on-chain";
    if (l.status === "warning") return "monitoring";
    if (l.status === "system") return "system";
    return l.status;
  };
  const searchFiltered = searchQuery ? logs.filter(l => {
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.target.toLowerCase().includes(q) ||
      (l.reason ?? "").toLowerCase().includes(q) ||
      String(l.amount).includes(q) ||
      l.token.toLowerCase().includes(q) ||
      l.status.toLowerCase().includes(q) ||
      l.policyVersion.toLowerCase().includes(q) ||
      (l.receipt ?? "").toLowerCase().includes(q) ||
      l.time.includes(q) ||
      getDisplayStatus(l).includes(q) ||
      (q === "approved" && l.status === "approved") ||
      (q === "rejected" && l.status === "rejected") ||
      (q === "on-chain" && l.status === "paused") ||
      (q === "logged" && (l.status === "approved" || l.status === "rejected"))
    );
  }) : logs;
  const filteredLogs = activeTab === "All" ? searchFiltered : searchFiltered.filter(l => {
    const tab = activeTab.toLowerCase();
    if (tab === "buys") return l.action === "BUY";
    if (tab === "sells") return l.action === "SELL";
    if (tab === "purchases") return l.action === "PURCHASE";
    if (tab === "grants") return l.action === "GRANT" || l.action === "PAY";
    if (tab === "payments") return l.action === "PAY" || l.action === "INVOICE";
    if (tab === "subscriptions") return l.action === "SUBSCRIBE";
    if (tab === "mints") return l.action === "MINT";
    if (tab === "bids") return l.action === "BID";
    if (tab === "rejected") return l.status === "rejected";
    if (tab === "warnings") return l.status === "warning";
    if (tab === "skipped") return l.action === "SKIP";
    if (tab === "paused") return l.status === "paused";
    if (tab === "system") return l.status === "system";
    if (tab === "approved") return l.status === "approved";
    return true;
  });

  const s: any = {
    shell: { height: "100vh", display: "flex", flexDirection: "column" as const, background: "#060a10", color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" },
    nav: { height: 52, background: "#0b0f18", borderBottom: "1px solid #1a2234", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0, zIndex: 10 },
    body: { flex: 1, display: "flex", overflow: "hidden", position: "relative" as const },
    col: { display: "flex", flexDirection: "column" as const, borderRight: "1px solid #1a2234", overflowY: "auto" as const },
    label: { fontSize: 11, color: "#475569" },
    value: { fontSize: 12, color: "#94a3b8" },
    sectionTitle: { fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 12 },
  };

  return (
    <div style={s.shell}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <header style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => router.push("/")}>
          <i className="ti ti-shield-bolt" style={{ fontSize: 18, color: "#60a5fa" }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Arbitra</span>
        </div>
        <span style={{ color: "#334155", fontSize: 13 }}>Workbench</span>
        <span style={{ fontSize: 10, color: "#64748b", background: "#151d2e", border: "1px solid #1e2d45", padding: "1px 6px", borderRadius: 4 }}>Beta</span>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
            <i className={`ti ${typeConfig.icon}`} style={{ fontSize: 14, color: typeConfig.color }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{agent.agentName}</span>
            <span style={{ color: "#334155" }}>·</span>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>{typeConfig.label}</span>
            <i className="ti ti-chevron-down" style={{ fontSize: 12, color: "#475569" }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: isRevoked ? "#ef4444" : isPaused ? "#f59e0b" : "#22c55e", display: "inline-block" }} />
            <span style={{ color: isRevoked ? "#ef4444" : isPaused ? "#f59e0b" : "#22c55e", fontWeight: 500 }}>
              {isRevoked ? "Revoked" : isPaused ? "Paused" : "Active"}
            </span>
          </div>

          {conf.warningButton && (
            <button
              onClick={isTrading ? handleStressTest : undefined}
              disabled={isStressTesting || isPaused || isRevoked}
              style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${conf.warningButton.color}`, background: "transparent", color: conf.warningButton.color, padding: "5px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              <i className={`ti ${conf.warningButton.icon}`} style={{ fontSize: 12 }} />
              {conf.warningButton.label}
            </button>
          )}

          {!isRevoked && (
            <button
              onClick={() => setShowRevokeConfirm(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #b91c1c", background: "transparent", color: "#ef4444", padding: "5px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              <i className="ti ti-shield-off" style={{ fontSize: 12 }} />
              Revoke
            </button>
          )}
        </div>
      </header>

      {stressMessage && (
        <div style={{ background: isPaused ? "#1a0d0d" : "#0d1a0d", borderBottom: `1px solid ${isPaused ? "#b91c1c" : "#166534"}`, padding: "8px 20px", fontSize: 12, color: isPaused ? "#ef4444" : "#22c55e", display: "flex", alignItems: "center", gap: 8 }}>
          <i className={`ti ${isPaused ? "ti-alert-triangle" : "ti-check"}`} style={{ fontSize: 14 }} />
          {stressMessage}
        </div>
      )}

      <div style={s.body}>

        <div style={{ ...s.col, width: 340 }}>
          <div style={{ padding: "16px 20px" }}>
            <p style={s.sectionTitle}>Agent Policy</p>

            <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" as const }}>
              {conf.templateTabs.map(t => (
                <button key={t} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #1e2d45", background: (agent as any).template === t.toLowerCase() || (!(agent as any).template && conf.templateTabs[0] === t) ? "#1a2d4a" : "transparent", color: (agent as any).template === t.toLowerCase() || (!(agent as any).template && conf.templateTabs[0] === t) ? "#60a5fa" : "#64748b", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {t}
                </button>
              ))}
            </div>

            {conf.policyFields.map(field => (
              <div key={field.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={s.label}>{field.label}</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  {field.key === "budget" ? `${agent.budget} ${agent.token}` :
                   field.key === "maxSingleTx" ? `${agent.maxSingleTx} ${agent.token}` :
                   field.key === "riskCeiling" ? `${agent.riskCeiling} / 100` :
                   field.key === "slippageGuardBps" ? `${agent.slippageGuardBps / 100}%` :
                   field.key === "tradingPair" ? agent.tradingPair :
                   field.key === "scope" ? agent.scope :
                   field.key === "expiry" ? (() => { if (agent.expiry === "0") return "Never"; const h = Number(agent.expiry); const deployed = agent.deployedAt; const remaining = Math.max(0, (deployed + h * 3600000) - Date.now()); const hrs = Math.floor(remaining / 3600000); const mins = Math.floor((remaining % 3600000) / 60000); return remaining > 0 ? `${hrs}h ${mins}m remaining` : "Expired"; })() :
                   field.key === "splitAddresses" ? "3 vendors" :
                   field.key === "recipientWhitelist" ? "3 approved" :
                   field.key === "receiptLogging" ? "On" :
                   field.key === "paymentSchedule" ? "On-demand" :
                   field.key === "subscriptionEnabled" ? "Active" :
                   field.key === "marketplaceAddress" ? "0x..." :
                   field.key === "daoOverrideAddress" ? (agent.owner?.slice(0, 8) + "...") :
                   "—"}
                </span>
              </div>
            ))}

            <div style={{ marginTop: 16, background: "#080c14", border: "1px solid #1a2234", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
              <div onClick={() => setSdkOpen(!sdkOpen)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-code" style={{ fontSize: 12, color: "#60a5fa" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9" }}>SDK Preview</span>
                </div>
                <i className={`ti ti-chevron-${sdkOpen ? "up" : "down"}`} style={{ fontSize: 11, color: "#475569" }} />
              </div>
              {sdkOpen && <pre style={{ fontSize: 10, color: "#60a5fa", margin: 0, whiteSpace: "pre-wrap" as const, lineHeight: 1.6, fontFamily: "monospace" }}>
{`const agent = await Arbitra.createPolicy({
  type: "${agent.agentType}",
  budget: ${agent.budget},
  token: "${agent.token}",
  scope: ["${agent.scope}"],
  expiry: "${agent.expiry}h",
  riskCeiling: ${agent.riskCeiling},
  maxTx: ${agent.maxSingleTx}
})`}
              </pre>}
            </div>

            <button onClick={() => setShowUpdatePolicy(true)} style={{ width: "100%", padding: "10px 0", background: "#1a2d4a", border: "1px solid #2563eb", color: "#60a5fa", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Update Policy
            </button>
          </div>
        </div>

        <div style={{ ...s.col, flex: 1 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a2234" }}>
            <p style={s.sectionTitle}>Activity Log</p>
            <div style={{ display: "flex", gap: 6, fontSize: 11, color: "#475569", marginBottom: 12 }}>
              <span>On-chain</span><span>·</span><span>Append-only</span><span>·</span><span>Tamper-proof</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 12 }}>
              {conf.filterTabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${activeTab === tab ? "#2563eb" : "#1e2d45"}`, background: activeTab === tab ? "#1a2d4a" : "transparent", color: activeTab === tab ? "#60a5fa" : "#64748b", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ position: "relative" as const }}>
              <input placeholder="Search log entries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "8px 12px 8px 32px", fontSize: 12, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" as const }} />
              <i className="ti ti-search" style={{ position: "absolute" as const, left: 10, top: 9, fontSize: 13, color: "#475569" }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" as const, display: "flex", flexDirection: "column" as const }}>
            {filteredLogs.map((log, i) => (
              <div key={i}>
                <div
                  onClick={() => setExpandedLog(expandedLog === i ? null : i)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid #1a2234", cursor: "pointer", background: expandedLog === i ? "#0e1623" : "transparent" }}
                >
                  <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace", flexShrink: 0 }}>[{log.time}]</span>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusDot[log.status], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: conf.logActionColors[log.action] ?? "#94a3b8" }}>{log.action}</span>
                    {log.amount > 0 && <span style={{ fontSize: 12, color: "#94a3b8" }}> · {log.amount} {log.token}</span>}
                    {log.target && <span style={{ fontSize: 12, color: "#64748b" }}> · {log.target}</span>}
                    {log.receipt && <span style={{ fontSize: 11, color: "#475569" }}> · receipt: {log.receipt}</span>}
                    {log.reason && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{log.reason}</div>}
                  </div>
                  <span style={{ fontSize: 11, color: "#334155", flexShrink: 0 }}>Policy {log.policyVersion}</span>
                  <span style={{ fontSize: 11, color: log.status === "approved" ? "#22c55e" : log.status === "rejected" ? "#ef4444" : "#f59e0b", flexShrink: 0 }}>
                    {log.status === "approved" ? "Logged" : log.status === "rejected" ? "Logged" : "On-chain"}
                  </span>
                  <i className={`ti ti-chevron-${expandedLog === i ? "up" : "down"}`} style={{ fontSize: 12, color: "#475569", flexShrink: 0 }} />
                </div>

                {expandedLog === i && (
                  <div style={{ background: "#080c14", borderBottom: "1px solid #1a2234", padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>PTB Transaction Hash</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 11, color: "#60a5fa", background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 4, padding: "3px 8px" }}>0xabc...def</span>
                        <button onClick={() => { try { navigator.clipboard.writeText('0xabc...def'); } catch(e) { const el = document.createElement('textarea'); el.value = '0xabc...def'; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); } }} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                          <i className="ti ti-copy" style={{ fontSize: 12 }} />
                        </button>
                        <a href={`https://suiexplorer.com/txblock/0xabc?network=testnet`} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, color: "#60a5fa", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                          Sui Explorer <i className="ti ti-arrow-up-right" style={{ fontSize: 10 }} />
                        </a>
                      </div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>Actions bundled in this PTB</p>
                      {["Policy check", "Budget validation", "Action execution", "Activity log write", "Budget decrement"].map(a => (
                        <div key={a} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <i className="ti ti-circle-check" style={{ fontSize: 11, color: "#22c55e" }} />
                          <span style={{ fontSize: 11, color: "#64748b" }}>{a}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>Agent Endpoint Called</p>
                      <a href={agent.endpointUrl || "#"} style={{ fontSize: 11, color: "#60a5fa", textDecoration: "none", display: "block", marginBottom: 12 }}>{agent.endpointUrl || "Arbitra Demo Agent"}</a>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>Agent Response Received</p>
                      <pre style={{ fontSize: 10, color: "#94a3b8", background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 6, padding: "8px", margin: 0, lineHeight: 1.5, fontFamily: "monospace" }}>
{`{
  "action": "${log.action.toLowerCase()}",
  "amount": ${log.amount},
  "target": "${log.target}"
}`}
                      </pre>
                      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "#475569" }}>Arbitra Decision:</span>
                        <span style={{ fontSize: 11, color: log.status === "approved" ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                          {log.status === "approved" ? "Approved · Executed" : "Rejected · Blocked"}
                        </span>
                      </div>
                      <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "#475569" }}>Policy at time of action:</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{log.policyVersion}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: "12px 20px", textAlign: "center" }}>
            <span style={{ fontSize: 11, color: "#334155" }}>— end of log —</span>
          </div>
          <div style={{ padding: "12px 20px", borderTop: "1px solid #1a2234", display: "flex", gap: 12 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #1e2d45", color: "#64748b", padding: "7px 14px", borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              <i className="ti ti-download" style={{ fontSize: 12 }} /> Export Log (CSV)
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #1e2d45", color: "#60a5fa", padding: "7px 14px", borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              View Full On-chain History <i className="ti ti-arrow-right" style={{ fontSize: 12 }} />
            </button>
          </div>
        </div>

        <div style={{ ...s.col, width: 400, borderRight: "none", overflowY: "auto" }}>
          <div style={{ padding: "16px 20px" }}>
            <p style={s.sectionTitle}>Agent Status</p>

            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
              <div style={{ position: "relative" as const, width: 100, height: 100 }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1e2d45" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={gaugeColor} strokeWidth="10"
                    strokeDasharray={`${gaugePercent * 251} 251`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: "stroke-dasharray 0.3s, stroke 0.3s" }}
                  />
                </svg>
                <div style={{ position: "absolute" as const, inset: 0, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{conf.gaugeLabel.split(" ")[0]}</span>
                  <span style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{conf.gaugeLabel.split(" ").slice(1).join(" ")}</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: gaugeColor, lineHeight: 1 }}>{gaugeValue}</span>
                  <span style={{ fontSize: 9, color: "#475569" }}>/ 100</span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                {conf.gaugeMetrics.map(m => (
                  <div key={m.key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{m.label}</span>
                    <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 500 }}>
                      {stats[m.key] ?? (m.key.includes("Compliance") || m.key.includes("Coverage") || m.key.includes("Adherence") ? "100%" : m.key.includes("Velocity") ? "Normal" : "Good")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 8, padding: "12px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {agent.agentType === "ecommerce" ? "Weekly Budget Used" : agent.agentType === "treasury" ? "Monthly Allocation Used" : "Budget Used"}
                </span>
                <span style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 500 }}>
                  {stats.budgetUsed ?? `${Math.floor(agent.budget * (stats.budgetUsedPercent ?? 20) / 100)} ${agent.token}`} / {agent.budget} {agent.token}
                </span>
              </div>
              <div style={{ height: 4, background: "#1e2d45", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${stats.budgetUsedPercent ?? 20}%`, background: (stats.budgetUsedPercent ?? 20) > 80 ? "#ef4444" : (stats.budgetUsedPercent ?? 20) > 60 ? "#f59e0b" : "#22c55e", borderRadius: 2, transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 11, color: "#475569" }}>{stats.budgetUsedPercent ?? 20}% used</span>
                <span style={{ fontSize: 11, color: "#60a5fa" }}>Policy v1.0</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                { label: "Approved", value: String(stats.approved ?? 0), color: "#22c55e" },
                { label: "Rejected", value: String(stats.rejected ?? 0), color: "#ef4444" },
                { label: "Avg Size", value: stats.avgSize ?? `0 ${agent.token}`, color: "#60a5fa" },
              ].map(s => (
                <div key={s.label} style={{ background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 6, padding: "8px 10px", textAlign: "center" as const }}>
                  <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: (s as any).color ?? "#f1f5f9" }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Connected Agent Info</p>
              {[
                { label: "Endpoint", value: agent.endpointUrl && agent.endpointUrl.startsWith('http') ? agent.endpointUrl.replace('https://', '').split('/')[0] : 'demo.arbitra.xyz' },
                { label: "Last Ping", value: "4s ago" },
                { label: "Response Avg", value: `${latency}ms` },
                { label: "Actions Approved", value: String(stats.approved ?? 0) },
                { label: "Actions Rejected", value: String(stats.rejected ?? 0) },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#475569" }}>{row.label}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Spend over last 7 days</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
                {[18, 35, 28, 52, 41, 63, stats.budgetUsedPercent ?? 20].map((v, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ width: "100%", height: `${(v / 100) * 40}px`, background: i === 6 ? "#22c55e" : "#1a2d4a", borderRadius: "2px 2px 0 0", minHeight: 4 }} />
                    <span style={{ fontSize: 9, color: "#334155" }}>{i === 6 ? "Now" : i % 2 === 0 ? `-${6-i}d` : ""}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Agent Memory</p>
              <div style={{ background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <i className="ti ti-database" style={{ fontSize: 11, color: "#22c55e" }} />
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>Session memory stored on Walrus</span>
                  <i className="ti ti-check" style={{ fontSize: 11, color: "#22c55e" }} />
                </div>
                <p style={{ fontSize: 11, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                  Previous session: {stats.approved ?? 4} actions · Avg spend: {stats.avgSize ?? `12 ${agent.token}`}
                </p>
                <button style={{ fontSize: 11, color: "#60a5fa", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  View Memory <i className="ti ti-arrow-right" style={{ fontSize: 10 }} />
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Status Indicators</p>
              {[
                { label: "Agent Status", value: isRevoked ? "Revoked" : isPaused ? "Paused" : "Active", color: isRevoked ? "#ef4444" : isPaused ? "#f59e0b" : "#22c55e" },
                { label: "On-chain Policy", value: "Verified", color: "#22c55e" },
                { label: "Agent Endpoint", value: "Connected", color: "#22c55e" },
                { label: "Walrus Log", value: "Synced", color: "#22c55e" },
                { label: "Receipt Logging", value: "Enabled", color: "#22c55e" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: row.color, display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: "#475569" }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: 11, color: row.color }}>✓ {row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Quick Actions</p>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                {conf.quickActions.map(action => (
                  <button
                    key={action.action}
                    onClick={action.action === "stress_test" ? handleStressTest : action.action === "update_risk" ? () => setShowUpdateRisk(true) : action.action === "pause" ? () => { setIsPaused(!isPaused); setLogs(prev => [{ time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), action: isPaused ? 'RESUMED' : 'PAUSED', amount: 0, token: agent?.token ?? 'USDC', target: isPaused ? 'Manual resume' : 'Manual pause', status: isPaused ? 'approved' : 'paused', reason: isPaused ? 'Resumed by owner' : 'Paused by owner', policyVersion: 'v1.1' }, ...prev]); } : undefined}
                    disabled={isRevoked}
                    style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid #1e2d45", color: action.color ?? "#94a3b8", padding: "7px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif', textAlign: 'left" }}
                  >
                    <i className={`ti ${action.icon}`} style={{ fontSize: 13 }} />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <a href={`https://suiexplorer.com/object/${policyId}?network=testnet`} target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#60a5fa", textDecoration: "none", marginBottom: 16 }}>
              View Policy on Sui Explorer <i className="ti ti-arrow-up-right" style={{ fontSize: 11 }} />
            </a>

            <button
              onClick={() => setShowRevokeConfirm(true)}
              disabled={isRevoked}
              style={{ width: "100%", padding: "11px 0", background: isRevoked ? "#1a0d0d" : "#1a0d0d", border: "1px solid #b91c1c", color: isRevoked ? "#475569" : "#ef4444", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: isRevoked ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'DM Sans', sans-serif" }}
            >
              <i className="ti ti-shield-off" style={{ fontSize: 14 }} />
              {isRevoked ? "Agent Revoked" : "Revoke Agent"}
            </button>
            {!isRevoked && <p style={{ fontSize: 11, color: "#475569", textAlign: "center" as const, marginTop: 4 }}>Instantly terminates agent. Logged on-chain. Irreversible.</p>}
          </div>
        </div>
      </div>

      <div style={{ height: 44, background: "#080c14", borderTop: "1px solid #1a2234", display: "flex", alignItems: "center", padding: "0 16px", gap: 0, overflowX: "auto" as const, flexShrink: 0 }}>
        {allAgents.map((a, i) => {
          const ac = getDashboardConfig(a.agentType);
          const tc = (agentTypeConfig as any)[a.agentType] ?? agentTypeConfig.custom;
          const isActive = a.policyId === policyId;
          const agentRisk = a.agentType === "trading" ? 44 : a.agentType === "ecommerce" ? 73 : a.agentType === "treasury" ? 68 : a.agentType === "gaming" ? 30 : a.agentType === "payments" ? 45 : 20;
          return (
            <button
              key={a.policyId}
              onClick={() => router.push(`/dashboard/${a.policyId}`)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: "100%", background: isActive ? "#0e1623" : "transparent", borderTop: isActive ? "2px solid #2563eb" : "2px solid transparent", borderRight: "1px solid #1a2234", borderLeft: "none", borderBottom: "none", cursor: "pointer", color: isActive ? "#f1f5f9" : "#64748b", fontSize: 12, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" as const, flexShrink: 0 }}
            >
              <i className={`ti ${tc.icon}`} style={{ fontSize: 13, color: tc.color }} />
              <span>{a.agentName && !a.agentName.startsWith('Object') ? a.agentName : 'Agent'}</span>
              <span style={{ color: "#334155" }}>·</span>
              <span style={{ color: "#475569" }}>{tc.label.split(" ")[0]}</span>
              <span style={{ color: "#334155" }}>·</span>
              <span style={{ color: "#475569" }}>{a.agentType === "trading" ? `Risk: ${agentRisk}` : ac.agentBarLabel({ budgetUsedPercent: agentRisk })}</span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            </button>
          );
        })}
        <button
          onClick={() => router.push("/new-agent")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: "100%", background: "transparent", border: "none", color: "#60a5fa", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" as const, flexShrink: 0 }}
        >
          <i className="ti ti-plus" style={{ fontSize: 13 }} /> Deploy New Agent
        </button>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, paddingRight: 16, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
            <i className="ti ti-building-bank" style={{ fontSize: 11 }} /> Sui Testnet
          </span>
          <span style={{ fontSize: 11, color: "#475569" }}>Block: #{blockNumber}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#475569" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />Pyth: Live
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#475569" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />Walrus: Synced
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#475569" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />Deepbook: Connected
          </span>
          <span style={{ fontSize: 11, color: "#475569" }}>Network: {latency}ms</span>
        </div>
      </div>

      {showUpdateRisk && agent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 14, width: 460, padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i className="ti ti-shield" style={{ fontSize: 16, color: "#60a5fa" }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>Update Risk Params</span>
                <span style={{ fontSize: 11, color: "#60a5fa", background: "#1a2d4a", border: "1px solid #2563eb", padding: "2px 8px", borderRadius: 4 }}>On-chain</span>
              </div>
              <button onClick={() => setShowUpdateRisk(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <i className="ti ti-x" style={{ fontSize: 16 }} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20, lineHeight: 1.5 }}>
              Update risk parameters on-chain without redeployment. Changes take effect immediately on the next agent action.
            </p>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9" }}>Risk Ceiling</span>
                <span style={{ fontSize: 13, color: agent.riskCeiling > 74 ? "#ef4444" : agent.riskCeiling > 49 ? "#f59e0b" : "#60a5fa", fontWeight: 600 }}>{agent.riskCeiling} / 100</span>
              </div>
              <input type="range" min={10} max={100} defaultValue={agent.riskCeiling}
                onChange={(e) => setAgent(prev => prev ? { ...prev, riskCeiling: Number(e.target.value) } : prev)}
                style={{ width: "100%", accentColor: "#2563eb" }} />
              <p style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Agent pauses above this score</p>
            </div>
            {agent.agentType === "trading" && (
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9", display: "block", marginBottom: 6 }}>Slippage Guard</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="number" step={0.1} defaultValue={(agent.slippageGuardBps / 100).toFixed(1)}
                    onChange={(e) => setAgent(prev => prev ? { ...prev, slippageGuardBps: Math.round(Number(e.target.value) * 100) } : prev)}
                    style={{ flex: 1, background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                  <div style={{ display: "flex", alignItems: "center", padding: "0 14px", background: "#080c14", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 13, color: "#64748b" }}>%</div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowUpdateRisk(false)}
                style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid #1e2d45", color: "#94a3b8", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={() => {
                setLogs(prev => [{
                  time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                  action: "RISK UPDATE",
                  amount: 0,
                  token: agent.token,
                  target: `Risk ceiling → ${agent.riskCeiling}`,
                  status: "system",
                  policyVersion: "v1.1",
                }, ...prev]);
                setShowUpdateRisk(false);
              }}
                style={{ flex: 2, padding: "11px 0", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <i className="ti ti-upload" style={{ fontSize: 14 }} /> Update On-chain
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdatePolicy && agent && (
        <UpdatePolicyModal
          agent={agent}
          onClose={() => setShowUpdatePolicy(false)}
          onUpdate={(updates) => {
            setAgent(prev => prev ? { ...prev, ...updates } : prev);
            setShowUpdatePolicy(false);
            setLogs(prev => [{
              time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              action: "POLICY UPDATE",
              amount: 0,
              token: agent.token,
              target: `Risk ceiling → ${updates.riskCeiling}, Max Tx → ${updates.maxSingleTx} ${agent.token}`,
              status: "system",
              policyVersion: "v1.1",
            }, ...prev]);
          }}
        />
      )}

      {showRevokeConfirm && (
        <div style={{ position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#0e1623", border: "1px solid #b91c1c", borderRadius: 12, padding: "28px 32px", width: 360, textAlign: "center" as const }}>
            <i className="ti ti-shield-off" style={{ fontSize: 32, color: "#ef4444", marginBottom: 16, display: "block" }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", marginBottom: 8 }}>Revoke this agent?</h3>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 24 }}>
              This will permanently terminate the agent. The policy will be set to REVOKED on Sui. The activity log will be sealed. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowRevokeConfirm(false)}
                style={{ flex: 1, padding: "10px 0", background: "transparent", border: "1px solid #1e2d45", color: "#94a3b8", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={() => { setIsRevoked(true); setShowRevokeConfirm(false); setStressMessage("Agent revoked. Policy sealed on-chain. Activity log closed."); }}
                style={{ flex: 1, padding: "10px 0", background: "#b91c1c", border: "none", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Revoke Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
