import { NextRequest, NextResponse } from "next/server";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { fromB64 } from "@mysten/sui.js/utils";

const CLOCK_ID = "0x6";
const SCOPE_DEEPBOOK = 1;
const SCOPE_CUSTOM = 2;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentName,
      agentType,
      budget,
      token,
      scope,
      expiry,
      riskCeiling,
      slippageGuardBps,
      maxSingleTx,
      beneficiary,
      daoOverride,
    } = body;

    const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID ?? "0x8d2d740caccc02db4643f6ebccada30e0b029fb6274fdb9ffed04fed3ad3e53c";
    const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "";

    if (!PRIVATE_KEY) {
      return NextResponse.json({ success: false, error: "Deployer key not configured." }, { status: 500 });
    }

    const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
    const keypair = Ed25519Keypair.fromSecretKey(fromB64(PRIVATE_KEY));
    const ownerAddress = keypair.getPublicKey().toSuiAddress();

    const expiryMs = expiry === "0" ? 99999999999 : Number(expiry) * 3600000;
    const scopeValue = scope === "deepbook" ? SCOPE_DEEPBOOK : SCOPE_CUSTOM;
    const budgetInUnits = Math.round(budget * 1_000_000);
    const maxTxInUnits = Math.round(maxSingleTx * 1_000_000);

    const agentNameBytes = Array.from(new TextEncoder().encode(agentName));
    const agentTypeBytes = Array.from(new TextEncoder().encode(agentType));
    const tokenBytes = Array.from(new TextEncoder().encode(token));

    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${PACKAGE_ID}::policy_object::create_policy`,
      arguments: [
        tx.pure(agentNameBytes, "vector<u8>"),
        tx.pure(agentTypeBytes, "vector<u8>"),
        tx.pure(budgetInUnits, "u64"),
        tx.pure(tokenBytes, "vector<u8>"),
        tx.pure(scopeValue, "u8"),
        tx.pure(beneficiary || ownerAddress, "address"),
        tx.pure(expiryMs, "u64"),
        tx.pure(riskCeiling, "u64"),
        tx.pure(slippageGuardBps, "u64"),
        tx.pure(maxTxInUnits, "u64"),
        tx.pure(beneficiary || ownerAddress, "address"),
        tx.pure(daoOverride || ownerAddress, "address"),
        tx.object(CLOCK_ID),
      ],
    });

    const result = await suiClient.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: keypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log(`[Deploy API] tx status: ${result.effects?.status?.status}`);

    if (result.effects?.status?.status !== "success") {
      throw new Error(`Transaction failed: ${result.effects?.status?.error}`);
    }

    const policyObject = result.objectChanges?.find(
      (o: any) => o.type === "created" && o.objectType?.includes("PolicyObject")
    );

    const policyId = (policyObject as any)?.objectId ?? result.digest;
    const txDigest = result.digest;

    console.log(`[Deploy API] Success — policyId: ${policyId} | tx: ${txDigest}`);

    return NextResponse.json({ success: true, policyId, txDigest, mock: false });

  } catch (error: any) {
    console.error("[Deploy API] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
