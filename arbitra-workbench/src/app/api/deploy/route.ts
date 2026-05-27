import { NextRequest, NextResponse } from "next/server";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { fromB64 } from "@mysten/sui.js/utils";

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
      console.error("[Deploy API] No private key configured");
      return NextResponse.json(
        { success: false, error: "Deployer key not configured." },
        { status: 500 }
      );
    }

    const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
    const keypair = Ed25519Keypair.fromSecretKey(fromB64(PRIVATE_KEY));
    const expiryTimestamp = Date.now() + (expiry === "0" ? 99999999999 : Number(expiry) * 3600000);
    const ownerAddress = keypair.getPublicKey().toSuiAddress();

    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${PACKAGE_ID}::policy_object::create_policy`,
      arguments: [
        tx.pure(agentName, "string"),
        tx.pure(agentType, "string"),
        tx.pure(Math.round(budget * 1000000), "u64"),
        tx.pure(token, "string"),
        tx.pure(scope, "string"),
        tx.pure(expiryTimestamp, "u64"),
        tx.pure(riskCeiling, "u64"),
        tx.pure(slippageGuardBps, "u64"),
        tx.pure(Math.round(maxSingleTx * 1000000), "u64"),
        tx.pure(beneficiary || ownerAddress, "address"),
        tx.pure(daoOverride || ownerAddress, "address"),
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

    const policyObject = result.objectChanges?.find(
      (o: any) => o.type === "created" && o.objectType?.includes("PolicyObject")
    );

    const policyId = (policyObject as any)?.objectId ?? result.digest;
    const txDigest = result.digest;

    console.log(`[Deploy API] Real deployment — policyId: ${policyId} | tx: ${txDigest}`);

    return NextResponse.json({
      success: true,
      policyId,
      txDigest,
      mock: false,
    });

  } catch (error: any) {
    console.error("[Deploy API] Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
