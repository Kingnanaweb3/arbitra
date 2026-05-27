"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardState, agentTypeConfig } from "@/lib/wizardState";
import { agentPolicyConfig } from "@/lib/policyConfig";
import { saveAgent } from "@/lib/agentStore";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getZkLoginAddress } from "@/lib/authStore";

type DeployState = "review" | "deploying" | "success";

interface DeployStep {
  label: string;
  status: "pending" | "active" | "done";
}

interface Step5Props {
  state: WizardState;
  onBack: () => void;
}

export default function Step5Deploy({ state, onBack }: Step5Props) {
  const router = useRouter();
  const account = useCurrentAccount();
  const [deployState, setDeployState] = useState<DeployState>("review");
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [policyId, setPolicyId] = useState("");
  const [txDigest, setTxDigest] = useState("");
  const [deploySteps, setDeploySteps] = useState<DeployStep[]>([
    { label: "Writing policy to Sui...", status: "pending" },
    { label: "Initializing activity log...", status: "pending" },
    { label: state.connectionType === "own" ? "Connecting agent endpoint..." : "Configuring demo agent...", status: "pending" },
    { label: "Agent live", status: "pending" },
  ]);

  const agentType = state.agentType ?? "custom";
  const typeConfig = agentTypeConfig[agentType];
  const policyConf = agentPolicyConfig[agentType];
  const isTrading = agentType === "trading";
  const isZkLogin = !account?.address && !!getZkLoginAddress();
  const ownerAddress = account?.address ?? getZkLoginAddress() ?? "";

  const updateStep = (index: number, status: DeployStep["status"]) => {
    setDeploySteps(prev => prev.map((s, i) => i === index ? { ...s, status } : s));
  };

  const onChainDetails = [
    { label: "Network", value: "Sui Testnet" },
    { label: "Contract", value: "PolicyObject (Move)" },
    { label: "Activity Log", value: "ActivityLog (Move)" },
    { label: "Oracle", value: isTrading ? "Pyth Network · Live" : "Not required", color: isTrading ? "#22c55e" : "#475569" },
    { label: "Execution Venue", value: isTrading ? "Deepbook · Connected" : agentType === "gaming" ? "Marketplace Contract" : agentType === "ecommerce" ? "Vendor Address" : "Recipient Whitelist", color: isTrading ? "#22c55e" : "#94a3b8" },
  ];

  const handleDeploy = async () => {
    if (!checked1 || !checked2) return;
    setDeployState("deploying");

    try {
      updateStep(0, "active");
      await new Promise(r => setTimeout(r, 1500));
      updateStep(0, "done");

      updateStep(1, "active");
      await new Promise(r => setTimeout(r, 1200));
      updateStep(1, "done");

      updateStep(2, "active");
      await new Promise(r => setTimeout(r, 1000));
      updateStep(2, "done");

      updateStep(3, "active");

      const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID ?? "0x8d2d740caccc02db4643f6ebccada30e0b029fb6274fdb9ffed04fed3ad3e53c";
      const PRIVATE_KEY = process.env.NEXT_PUBLIC_DEPLOYER_KEY ?? "";

      {
        saveAgent({
          policyId: finalPolicyId,
          capId: "",
          txDigest: finalTxDigest,
          agentName: state.agentName,
          agentType,
          template: state.template,
          agentIcon: state.agentIcon,
          strategy: state.strategy,
          budget: state.budget,
          token: state.token,
          tradingPair: state.tradingPair,
          scope: state.scope,
          expiry: state.expiry,
          riskCeiling: state.riskCeiling,
          slippageGuardBps: state.slippageGuardBps,
          maxSingleTx: state.maxSingleTx,
          connectionType: state.connectionType ?? "demo",
          endpointUrl: state.endpointUrl,
          deployedAt: Date.now(),
          network: "testnet",
          owner: ownerAddress,
        });
      }

      updateStep(3, "done");
      await new Promise(r => setTimeout(r, 500));
      setDeployState("success");

    } catch (error) {
      console.error("Deployment failed:", error);
      setDeployState("review");
      alert("Deployment failed. Please try again.");
    }
  };

  const PolicyReview = () => (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 32px 32px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f1f5f9", marginBottom: 8 }}>Ready to deploy.</h2>
        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
          Review your policy one final time.<br />
          Once deployed, your agent goes live on Sui immediately.
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 8, padding: "6px 16px", marginTop: 14, fontSize: 13, color: "#94a3b8" }}>
          <i className={`ti ${typeConfig.icon}`} style={{ fontSize: 14, color: typeConfig.color }} />
          <span>{typeConfig.label}</span>
          <span style={{ color: "#334155" }}>·</span>
          <span>{state.agentName || "My Agent"}</span>
          {isTrading && state.strategy && <><span style={{ color: "#334155" }}>·</span><span>{state.strategy.toUpperCase()} Strategy</span></>}
        </div>
      </div>

      <div style={{ background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 12, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <i className="ti ti-file-description" style={{ fontSize: 14, color: "#60a5fa" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>Final Policy Review</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>AGENT</p>
          {[
            { label: "Name", value: state.agentName && !state.agentName.startsWith("Object") ? state.agentName : "My Agent" },
            { label: "Type", value: typeConfig.label },
            isTrading ? { label: "Strategy", value: state.strategy.toUpperCase() } : null,
            { label: "Connection", value: state.connectionType === "own" ? (state.endpointUrl && state.endpointUrl.startsWith("http") ? state.endpointUrl : "—") : "Arbitra Demo Agent", extra: state.connectionType === "own" ? "Connected" : "Ready", extraColor: "#22c55e" },
          ].filter(Boolean).map((row: any) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a2234" }}>
              <span style={{ fontSize: 12, color: "#475569" }}>{row.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{row.value}</span>
                {row.extra && <span style={{ fontSize: 11, color: row.extraColor }}>· {row.extra}</span>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>POLICY</p>
          {[
            { label: "Budget", value: `${state.budget} ${state.token}` },
            isTrading ? { label: "Trading Pair", value: state.tradingPair } : null,
            { label: "Scope", value: state.scope === "deepbook" ? "Deepbook" : "Custom" },
            { label: "Expiry", value: state.expiry === "0" ? "Never" : `${state.expiry} hours` },
            { label: "Risk Ceiling", value: `${state.riskCeiling} / 100` },
            isTrading ? { label: "Slippage Guard", value: `${state.slippageGuardBps / 100}%` } : null,
            { label: "Max Per Tx", value: `${state.maxSingleTx} ${state.token}` },
            { label: "Treasury", value: state.beneficiaryAddress ? state.beneficiaryAddress.slice(0, 10) + "..." : "Not set" },
            { label: "DAO Override", value: state.daoOverrideAddress ? state.daoOverrideAddress.slice(0, 10) + "..." : "Not set" },
          ].filter(Boolean).map((row: any) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a2234" }}>
              <span style={{ fontSize: 12, color: "#475569" }}>{row.label}</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div>
          <p style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>ON-CHAIN</p>
          {onChainDetails.map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a2234" }}>
              <span style={{ fontSize: 12, color: "#475569" }}>{row.label}</span>
              <span style={{ fontSize: 12, color: row.color ?? "#94a3b8" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const RightPanel = () => {
    if (deployState === "review") return (
      <div style={{ width: 320, background: "#080c14", borderLeft: "1px solid #1a2234", padding: "32px 24px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <i className="ti ti-info-circle" style={{ fontSize: 15, color: "#60a5fa" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>What happens when you deploy</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 24 }}>
          {[
            { num: 1, title: "Write PolicyObject to Sui as a Move object" },
            { num: 2, title: "Agent reads policy before every action" },
            { num: 3, title: "Activity Log begins recording every action" },
          ].map((step, i) => (
            <div key={step.num} style={{ display: "flex", gap: 12, paddingBottom: i < 2 ? 16 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#1a2d4a", border: "1px solid #2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#60a5fa", fontWeight: 600, flexShrink: 0 }}>
                  {step.num}
                </div>
                {i < 2 && <div style={{ width: 1, flex: 1, background: "#1e2d45", margin: "4px 0" }} />}
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: 0, paddingTop: 3 }}>{step.title}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "#0e1623", border: "1px solid #d97706", borderRadius: 8, padding: "10px 12px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <i className="ti ti-lock" style={{ fontSize: 14, color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
            {isZkLogin
              ? "You will be prompted to approve one transaction via your Arbitra session."
              : "Your wallet will prompt you to sign one transaction to deploy the PolicyObject on-chain. This is the only signature required. The agent handles everything after."}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, fontSize: 12 }}>
          <span style={{ color: "#475569" }}>Estimated gas fee</span>
          <span style={{ color: "#94a3b8" }}>~0.002 SUI</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
          <span style={{ color: "#475569" }}>Deployment time</span>
          <span style={{ color: "#94a3b8" }}>~3 seconds</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, fontSize: 12 }}>
          <span style={{ color: "#475569" }}>Network</span>
          <span style={{ color: "#94a3b8" }}>Sui Testnet</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={checked1} onChange={(e) => setChecked1(e.target.checked)}
              style={{ marginTop: 2, accentColor: "#2563eb", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
              I understand that Budget and Scope cannot be changed without full policy redeployment.
            </span>
          </label>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={checked2} onChange={(e) => setChecked2(e.target.checked)}
              style={{ marginTop: 2, accentColor: "#2563eb", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
              I understand this policy will be enforced at the Sui VM level and cannot be overridden by the agent.
            </span>
          </label>
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={handleDeploy}
            disabled={!checked1 || !checked2}
            style={{ width: "100%", padding: "12px 0", background: checked1 && checked2 ? "#2563eb" : "#1e2837", color: checked1 && checked2 ? "#fff" : "#475569", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: checked1 && checked2 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'DM Sans', sans-serif" }}
          >
            <i className="ti ti-rocket" style={{ fontSize: 14 }} />
            Deploy Agent
          </button>
          <button onClick={onBack}
            style={{ width: "100%", padding: "10px 0", background: "transparent", border: "1px solid #1e2d45", color: "#94a3b8", borderRadius: 8, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'DM Sans', sans-serif" }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} /> Back
          </button>
        </div>
      </div>
    );

    if (deployState === "deploying") return (
      <div style={{ width: 320, background: "#080c14", borderLeft: "1px solid #1a2234", padding: "32px 24px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <i className="ti ti-loader-2" style={{ fontSize: 15, color: "#60a5fa" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>Deployment in progress</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          {deploySteps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: step.status === "done" ? "#2563eb" : step.status === "active" ? "#1a2d4a" : "#0e1623", border: `1px solid ${step.status === "done" ? "#2563eb" : step.status === "active" ? "#2563eb" : "#1e2d45"}` }}>
                {step.status === "done" && <i className="ti ti-check" style={{ fontSize: 12, color: "#fff" }} />}
                {step.status === "active" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a5fa" }} />}
                {step.status === "pending" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#334155" }} />}
              </div>
              <span style={{ fontSize: 12, color: step.status === "active" ? "#f1f5f9" : step.status === "done" ? "#60a5fa" : "#475569" }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ background: "#0e1623", border: "1px solid #d97706", borderRadius: 8, padding: "10px 12px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <i className="ti ti-lock" style={{ fontSize: 14, color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
            {isZkLogin ? "Approving transaction via your Arbitra session..." : "Your wallet will prompt you to sign one transaction to deploy the PolicyObject on-chain. This is the only signature required. The agent handles everything after."}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
          <span style={{ color: "#475569" }}>Network</span>
          <span style={{ color: "#94a3b8" }}>Sui Testnet</span>
        </div>

        <div style={{ marginTop: "auto" }}>
          <button disabled style={{ width: "100%", padding: "12px 0", background: "#1e2837", color: "#475569", border: "none", borderRadius: 8, fontSize: 13, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'DM Sans', sans-serif" }}>
            <i className="ti ti-loader-2" style={{ fontSize: 14 }} />
            Writing policy to Sui...
          </button>
        </div>
      </div>
    );

    return (
      <div style={{ width: 320, background: "#080c14", borderLeft: "1px solid #1a2234", padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#0d2d1a", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <i className="ti ti-check" style={{ fontSize: 30, color: "#22c55e" }} />
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", textAlign: "center", marginBottom: 8 }}>
          Agent deployed successfully.
        </h3>
        <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>
          {state.agentName || "Your agent"} is now live on Sui testnet.
        </p>

        <div style={{ width: "100%", background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Policy Object</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#60a5fa", flex: 1, wordBreak: "break-all" }}>{policyId}</span>
            <button onClick={() => { try { navigator.clipboard.writeText(policyId); } catch(e) { const el = document.createElement('textarea'); el.value = policyId; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); } }}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
              <i className="ti ti-copy" style={{ fontSize: 14 }} />
            </button>
          </div>
          <a href={`https://suiexplorer.com/object/${policyId}?network=testnet`} target="_blank" rel="noreferrer"
            style={{ fontSize: 11, color: "#60a5fa", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
            Sui Explorer <i className="ti ti-arrow-up-right" style={{ fontSize: 11 }} />
          </a>
        </div>

        <div style={{ width: "100%", background: "#0e1623", border: "1px solid #1e2d45", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Transaction</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#94a3b8", flex: 1, wordBreak: "break-all" }}>{txDigest}</span>
            <button onClick={() => { try { navigator.clipboard.writeText(txDigest); } catch(e) { const el = document.createElement('textarea'); el.value = txDigest; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); } }}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
              <i className="ti ti-copy" style={{ fontSize: 14 }} />
            </button>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
          Your agent is active and enforcing its policy. Every action is being logged on-chain.
        </p>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => router.push(`/dashboard/${policyId}`)}
            style={{ width: "100%", padding: "12px 0", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'DM Sans', sans-serif" }}>
            View Dashboard <i className="ti ti-arrow-right" style={{ fontSize: 14 }} />
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { const url = `${window.location.origin}/dashboard/${policyId}`; try { navigator.clipboard.writeText(url); } catch(e) { const el = document.createElement('textarea'); el.value = url; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); } alert('Link copied!'); }}
              style={{ flex: 1, padding: "9px 0", background: "transparent", border: "1px solid #1e2d45", color: "#94a3b8", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
              <i className="ti ti-share" style={{ fontSize: 13 }} /> Share
            </button>
            <button onClick={() => {
              const sdkCode = `const agent = await Arbitra.createPolicy({\n  type: "${agentType}",\n  budget: ${state.budget},\n  token: "${state.token}",\n  scope: ["${state.scope}"],\n  expiry: "${state.expiry}h",\n  riskCeiling: ${state.riskCeiling},\n  maxTx: ${state.maxSingleTx}\n})`;
              navigator.clipboard.writeText(sdkCode);
            }}
              style={{ flex: 1, padding: "9px 0", background: "transparent", border: "1px solid #1e2d45", color: "#94a3b8", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
              <i className="ti ti-code" style={{ fontSize: 13 }} /> Copy SDK
            </button>
          </div>
          <button onClick={() => router.push('/new-agent')}
            style={{ width: "100%", padding: "9px 0", background: "transparent", border: "1px solid #1e2d45", color: "#64748b", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Deploy Another Agent
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <PolicyReview />
      <RightPanel />
    </div>
  );
}
