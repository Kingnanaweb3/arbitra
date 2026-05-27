import { NextRequest, NextResponse } from "next/server";
import { CoreClient as SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

const getFullnodeUrl = (network: string) => `https://fullnode.${network}.sui.io:443`;
const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID ?? "0x8d2d740caccc02db4643f6ebccada30e0b029fb6274fdb9ffed04fed3ad3e53c";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "";

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
      budgetUsed: Number(fields.budget_used ?? 0) / 1000000,
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

async function logActionOnChain(
  policyId: string,
  actionType: string,
  amount: number,
  approved: boolean,
  reason: string,
  riskScore: number
) {
  if (!PRIVATE_KEY) {
    console.log("[Action API] No private key — skipping on-chain log");
    return null;
  }

  try {
    const keypair = Ed25519Keypair.fromSecretKey(PRIVATE_KEY);
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::activity_log::log_action`,
      arguments: [
        tx.pure.address(policyId),
        tx.pure.string(actionType),
        tx.pure.u64(Math.round(amount * 1000000)),
        tx.pure.bool(approved),
        tx.pure.string(reason || ""),
        tx.pure.u64(riskScore),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: { showEffects: true },
    });

    console.log(`[Action API] On-chain log tx: ${result.digest}`);
    return result.digest;
  } catch (error: any) {
    console.error("[Action API] On-chain log failed:", error.message);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, amount, riskScore, slippageBps, policyId } = body;

    console.log(`[Arbitra API] Action: ${action} | Amount: ${amount} | Risk: ${riskScore} | PolicyId: ${policyId}`);

    // Fetch real policy from Sui if policyId provided
    let policy = null;
    if (policyId) {
      policy = await fetchPolicyFromChain(policyId);
      console.log(`[Arbitra API] Policy fetched: ${policy ? "yes" : "not found"}`);
    }

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
      slippageCheck: !slippageBps || slippageBps <= slippageGuard,
      maxTxCheck: amount <= maxSingleTx,
      actionValid: ["BUY", "SELL", "SKIP", "TRANSFER", "PAY", "PURCHASE", "GRANT", "MINT", "BID", "APPROVE", "SUBSCRIBE", "SWAP", "DEPOSIT", "WITHDRAW", "STAKE", "UNSTAKE"].includes(action),
    };

    const approved = Object.values(checks).every(Boolean);
    const rejectionReason = !checks.budgetCheck ? `Budget exceeded — ${amount} > ${budgetRemaining} remaining` :
      !checks.riskCheck ? `Risk score ${riskScore} exceeds ceiling ${riskCeiling}` :
      !checks.slippageCheck ? `Slippage ${slippageBps}bps exceeds guard ${slippageGuard}bps` :
      !checks.maxTxCheck ? `Amount ${amount} exceeds max single tx ${maxSingleTx}` :
      !checks.actionValid ? `Action type ${action} not in allowed list` : "";

    console.log(`[Arbitra API] Decision: ${approved ? "APPROVED" : "REJECTED"} ${rejectionReason ? `— ${rejectionReason}` : ""}`);

    // Write real on-chain transaction
    let txDigest = null;
    if (policyId && action !== "SKIP") {
      txDigest = await logActionOnChain(
        policyId,
        action,
        amount,
        approved,
        rejectionReason,
        riskScore
      );
    }

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
      txDigest,
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
