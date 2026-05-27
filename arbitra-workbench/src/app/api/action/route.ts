import { NextRequest, NextResponse } from "next/server";
import { CoreClient as SuiClient } from "@mysten/sui/client";
const getFullnodeUrl = (network: string) => `https://fullnode.${network}.sui.io:443`;

const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID ?? "0x8d2d740caccc02db4643f6ebccada30e0b029fb6274fdb9ffed04fed3ad3e53c";

async function fetchPolicyFromChain(policyId: string) {
  try {
    const obj = await suiClient.getObject({
      id: policyId,
      options: { showContent: true },
    });
    const fields = (obj.data?.content as any)?.fields;
    if (!fields) return null;
    return {
      budget: Number(fields.budget) / 1000000,
      budgetUsed: Number(fields.budget_used) / 1000000,
      riskCeiling: Number(fields.risk_ceiling),
      slippageGuardBps: Number(fields.slippage_guard_bps),
      maxSingleTx: Number(fields.max_single_tx) / 1000000,
      scope: fields.scope,
      expiry: Number(fields.expiry_timestamp),
      isPaused: fields.is_paused ?? false,
      isRevoked: fields.is_revoked ?? false,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, amount, riskScore, slippageBps, policyId } = body;

    console.log(`[Arbitra API] Action: ${action} | Amount: ${amount} | Risk: ${riskScore} | SlippageBps: ${slippageBps}`);

    let policy = null;
    if (policyId) {
      policy = await fetchPolicyFromChain(policyId);
    }

    // Use on-chain policy if available, otherwise use defaults
    const budget = policy?.budget ?? 200;
    const budgetUsed = policy?.budgetUsed ?? 0;
    const riskCeiling = policy?.riskCeiling ?? 75;
    const slippageGuard = policy?.slippageGuardBps ?? 250;
    const maxSingleTx = policy?.maxSingleTx ?? 50;
    const budgetRemaining = budget - budgetUsed;

    if (policy?.isPaused) {
      return NextResponse.json({
        approved: false,
        rejectionReason: "Policy is paused",
        policyVersion: "v1.0",
        timestamp: Date.now(),
      });
    }

    if (policy?.isRevoked) {
      return NextResponse.json({
        approved: false,
        rejectionReason: "Policy has been revoked",
        policyVersion: "v1.0",
        timestamp: Date.now(),
      });
    }

    const checks = {
      budgetCheck: amount <= budgetRemaining,
      riskCheck: riskScore <= riskCeiling,
      slippageCheck: slippageBps <= slippageGuard,
      maxTxCheck: amount <= maxSingleTx,
      actionValid: ["BUY", "SELL", "SKIP", "TRANSFER", "PAY", "PURCHASE", "GRANT", "MINT", "BID"].includes(action),
    };

    const approved = Object.values(checks).every(Boolean);
    const rejectionReason = !checks.budgetCheck ? "Budget exceeded" :
      !checks.riskCheck ? `Risk score ${riskScore} exceeds ceiling ${riskCeiling}` :
      !checks.slippageCheck ? `Slippage ${slippageBps}bps exceeds guard ${slippageGuard}bps` :
      !checks.maxTxCheck ? `Amount ${amount} exceeds max single tx ${maxSingleTx}` :
      !checks.actionValid ? `Action type ${action} not allowed` : null;

    console.log(`[Arbitra API] Decision: ${approved ? "APPROVED" : "REJECTED"} ${rejectionReason ? `— ${rejectionReason}` : ""}`);

    return NextResponse.json({
      approved,
      action,
      amount,
      riskScore,
      checks,
      rejectionReason,
      budgetRemaining: approved ? budgetRemaining - amount : budgetRemaining,
      policyVersion: "v1.0",
      onChainPolicy: !!policy,
      timestamp: Date.now(),
    });

  } catch (error: any) {
    console.error("[Arbitra API] Error:", error.message);
    return NextResponse.json({ approved: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "Arbitra Policy Enforcement API",
    version: "1.0",
    status: "active",
    packageId: PACKAGE_ID,
  });
}
