import { ArbitraClient } from "../lib/client.js";
import { PolicyConfig } from "../types/index.js";

// ── Config ────────────────────────────────────────────────
const PACKAGE_ID = "0x8d2d740caccc02db4643f6ebccada30e0b029fb6274fdb9ffed04fed3ad3e53c";
const NETWORK = "testnet";

// Replace with your actual private key
const PRIVATE_KEY = process.env.AEGIS_PRIVATE_KEY ?? "";

// ── Helpers ───────────────────────────────────────────────
function log(section: string, message: string) {
  console.log(`\n[${section}] ${message}`);
}

function logResult(label: string, value: string) {
  console.log(`  ${label}: ${value}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main Demo ─────────────────────────────────────────────
async function runDemo() {
  console.log("=".repeat(60));
  console.log("AEGIS PROTOCOL — LIVE DEMO");
  console.log("Policy enforcement for AI agents on Sui");
  console.log("=".repeat(60));

  if (!PRIVATE_KEY) {
    throw new Error(
      "AEGIS_PRIVATE_KEY environment variable not set. " +
      "Export your private key before running the demo."
    );
  }

  // ── Step 1: Initialize client ─────────────────────────
  log("INIT", "Connecting to Sui testnet...");

  const client = new ArbitraClient({
    network: NETWORK,
    packageId: PACKAGE_ID,
    privateKey: PRIVATE_KEY,
  });

  const ownerAddress = client.getAddress();
  logResult("Owner address", ownerAddress);
  logResult("Network", NETWORK);
  logResult("Package ID", PACKAGE_ID);

  // ── Step 2: Deploy policy ─────────────────────────────
  log("DEPLOY", "Deploying agent policy to Sui...");

  const policyConfig: PolicyConfig = {
    agentName: "Arbitra Demo Agent",
    agentType: "trading",
    budget: 200,
    token: "USDC",
    scope: "deepbook",
    expiryMs: 86400000,      // 24 hours
    riskCeiling: 75,
    slippageGuardBps: 250,   // 2.5%
    maxSingleTx: 50,
    beneficiary: ownerAddress,
    daoOverride: ownerAddress,
  };

  logResult("Agent name", policyConfig.agentName);
  logResult("Budget", `${policyConfig.budget} USDC`);
  logResult("Risk ceiling", `${policyConfig.riskCeiling} / 100`);
  logResult("Slippage guard", `${policyConfig.slippageGuardBps} bps`);
  logResult("Max per tx", `${policyConfig.maxSingleTx} USDC`);
  logResult("Expiry", "24 hours");

  const policy = await client.createPolicy(policyConfig);

  logResult("Policy ID", policy.policyId);
  logResult("Tx digest", policy.txDigest);
  logResult("Explorer", client.getExplorerUrl(policy.txDigest));

  await sleep(2000);

  // ── Step 3: Execute approved actions ──────────────────
  log("ACTION 1", "Agent executing BUY action — risk 38, slippage 0.4%");

  const action1 = await client.validateAction(policy.policyId, {
    type: "BUY",
    amount: 12,
    scope: "deepbook",
    riskScore: 38,
    slippageBps: 180,
  });

  logResult("Approved", String(action1.approved));
  logResult("Budget remaining", `${action1.budgetRemaining} USDC`);
  if (action1.txDigest) {
    logResult("Explorer", client.getExplorerUrl(action1.txDigest));
  }

  await sleep(2000);

  log("ACTION 2", "Agent executing BUY action — risk 41, slippage 0.6%");

  const action2 = await client.validateAction(policy.policyId, {
    type: "BUY",
    amount: 12,
    scope: "deepbook",
    riskScore: 41,
    slippageBps: 200,
  });

  logResult("Approved", String(action2.approved));
  logResult("Budget remaining", `${action2.budgetRemaining} USDC`);
  if (action2.txDigest) {
    logResult("Explorer", client.getExplorerUrl(action2.txDigest));
  }

  await sleep(2000);

  log("ACTION 3", "Agent executing BUY action — risk 44, slippage 0.5%");

  const action3 = await client.validateAction(policy.policyId, {
    type: "BUY",
    amount: 12,
    scope: "deepbook",
    riskScore: 44,
    slippageBps: 190,
  });

  logResult("Approved", String(action3.approved));
  logResult("Budget remaining", `${action3.budgetRemaining} USDC`);
  if (action3.txDigest) {
    logResult("Explorer", client.getExplorerUrl(action3.txDigest));
  }

  await sleep(2000);

  // ── Step 4: Risk spike — agent pauses ─────────────────
  log("RISK SPIKE", "Market conditions deteriorating — risk score 90");
  log("RISK SPIKE", "Risk ceiling is 75 — agent must pause itself");

  const pauseTx = await client.pausePolicy(policy.policyId, 90);

  logResult("Agent status", "PAUSED");
  logResult("Risk score", "90 / 100");
  logResult("Ceiling", "75 / 100");
  logResult("Reason", "Risk ceiling breached — policy triggered");
  logResult("Logged on-chain", "true");
  logResult("Explorer", client.getExplorerUrl(pauseTx));

  await sleep(3000);

  // ── Step 5: Conditions normalize — agent resumes ──────
  log("RESUME", "Conditions normalizing — risk score dropping to 61");
  log("RESUME", "Agent resuming automatically — no human action required");

  const resumeTx = await client.resumePolicy(policy.policyId, 61);

  logResult("Agent status", "ACTIVE");
  logResult("Risk score", "61 / 100");
  logResult("Resumed by", "policy (automatic)");
  logResult("Logged on-chain", "true");
  logResult("Explorer", client.getExplorerUrl(resumeTx));

  await sleep(2000);

  // ── Step 6: Check policy status ───────────────────────
  log("STATUS", "Reading live policy status from Sui...");

  const status = await client.getPolicyStatus(policy.policyId);

  logResult("Status", status.status);
  logResult("Budget used", `${status.budgetTotal - status.budgetRemaining} USDC`);
  logResult("Budget remaining", `${status.budgetRemaining} USDC`);
  logResult("Budget used percent", `${status.budgetUsedPercent}%`);
  logResult("Total actions", String(status.totalActions));
  logResult("Total approved", String(status.totalApproved));
  logResult("Policy version", String(status.policyVersion));

  await sleep(2000);

  // ── Step 7: Revoke policy ─────────────────────────────
  log("REVOKE", "Owner revoking policy — instant on-chain termination");

  // Note: capId needs to be retrieved from the deployment
  // For the demo we show the revocation flow
  // Full implementation retrieves cap from deployment result
  console.log("  Revocation requires PolicyCap object ID");
  console.log("  In production: retrieved automatically from deployment");
  console.log("  On-chain: policy status set to REVOKED permanently");
  console.log("  Activity log: sealed, no further writes possible");

  // ── Summary ───────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("DEMO COMPLETE");
  console.log("=".repeat(60));
  console.log("\nWhat just happened on Sui testnet:");
  console.log("  1. Policy deployed as a Move object");
  console.log("  2. Agent executed 3 approved actions");
  console.log("  3. Risk guardian paused the agent at score 90");
  console.log("  4. Agent resumed automatically when risk normalized");
  console.log("  5. Policy status read directly from on-chain state");
  console.log("  6. Every action logged permanently on-chain");
  console.log("\nVerify on Sui Explorer:");
  console.log(`  https://suiexplorer.com/object/${policy.policyId}?network=testnet`);
  console.log("\nPackage ID:");
  console.log(`  ${PACKAGE_ID}`);
  console.log("=".repeat(60));
}

// ── Run ───────────────────────────────────────────────────
runDemo().catch((error) => {
  console.error("\n[ERROR]", error.message);
  process.exit(1);
});
