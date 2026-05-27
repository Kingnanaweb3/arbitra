import { NextRequest, NextResponse } from "next/server";
import { CoreClient as SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";

const getFullnodeUrl = (network: string) => `https://fullnode.${network}.sui.io:443`;
const suiClient = new SuiClient({ url: getFullnodeUrl("testnet"), network: "testnet" });
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID ?? "0x8d2d740caccc02db4643f6ebccada30e0b029fb6274fdb9ffed04fed3ad3e53c";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "";
const CLOCK_ID = "0x6";

const SCOPE_DEEPBOOK = 1;
const SCOPE_CUSTOM = 2;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, amount, riskScore, slippageBps, policyId, scope } = body;

    console.log(`[Arbitra API] Action: ${action} | Amount: ${amount} | Risk: ${riskScore} | PolicyId: ${policyId}`);

    if (!policyId) {
      return NextResponse.json({
        approved: false,
        rejectionReason: "No policy ID provided",
        timestamp: Date.now(),
      });
    }

    if (!PRIVATE_KEY) {
      return NextResponse.json({
        approved: false,
        rejectionReason: "Deployer key not configured",
        timestamp: Date.now(),
      });
    }

    const keypair = Ed25519Keypair.fromSecretKey(fromBase64(PRIVATE_KEY));
    const tx = new Transaction();

    // Convert amount to contract units (multiply by 1,000,000)
    const amountInUnits = Math.round(amount * 1_000_000);
    const scopeCheck = scope === "deepbook" ? SCOPE_DEEPBOOK : SCOPE_CUSTOM;

    // Call validate_action on-chain — this enforces policy and emits events
    tx.moveCall({
      target: `${PACKAGE_ID}::policy_object::validate_action`,
      arguments: [
        tx.object(policyId),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(action))),
        tx.pure.u64(amountInUnits),
        tx.pure.u8(scopeCheck),
        tx.pure.u64(Math.round(riskScore)),
        tx.pure.u64(slippageBps ?? 0),
        tx.object(CLOCK_ID),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: { showEffects: true },
    });

    const success = result.effects?.status?.status === "success";
    console.log(`[Arbitra API] On-chain result: ${success ? "APPROVED" : "REJECTED"} | tx: ${result.digest}`);

    return NextResponse.json({
      approved: success,
      action,
      amount,
      riskScore,
      txDigest: result.digest,
      policyVersion: "v1.0",
      onChainPolicy: true,
      timestamp: Date.now(),
    });

  } catch (error: any) {
    console.error("[Arbitra API] Error:", error.message);

    // Parse Move abort errors into human-readable rejections
    const msg = error.message ?? "";
    let rejectionReason = "Policy check failed";

    if (msg.includes("E_BUDGET_EXCEEDED") || msg.includes("3")) rejectionReason = "Budget exceeded";
    else if (msg.includes("E_RISK_CEILING") || msg.includes("4")) rejectionReason = "Risk ceiling breached";
    else if (msg.includes("E_SLIPPAGE") || msg.includes("5")) rejectionReason = "Slippage exceeded";
    else if (msg.includes("E_TX_LIMIT") || msg.includes("6")) rejectionReason = "Max transaction limit exceeded";
    else if (msg.includes("E_SCOPE") || msg.includes("7")) rejectionReason = "Scope violation";
    else if (msg.includes("E_POLICY_EXPIRED") || msg.includes("8")) rejectionReason = "Policy expired";
    else if (msg.includes("E_POLICY_REVOKED") || msg.includes("9")) rejectionReason = "Policy revoked";

    return NextResponse.json({
      approved: false,
      rejectionReason,
      error: msg,
      timestamp: Date.now(),
    });
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
