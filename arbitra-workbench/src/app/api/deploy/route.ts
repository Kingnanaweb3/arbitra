import { NextRequest, NextResponse } from "next/server";

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
        { success: false, error: "Deployer key not configured. Contact admin." },
        { status: 500 }
      );
    }

    // Real deployment using SDK
    const { SuiClient, getFullnodeUrl } = await import("@mysten/sui/client");
    const { Ed25519Keypair } = await import("@mysten/sui/keypairs/ed25519");
    const { Transaction } = await import("@mysten/sui/transactions");

    const suiClient = new SuiClient({ url: getFullnodeUrl("testnet"), network: "testnet" });
    const keypair = Ed25519Keypair.fromSecretKey(fromBase64(PRIVATE_KEY));

    const expiryMs = expiry === "0" ? 99999999999 : Number(expiry) * 3600000;
    const expiryTimestamp = Date.now() + expiryMs;

    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::policy_object::create_policy`,
      arguments: [
        tx.pure.string(agentName),
        tx.pure.string(agentType),
        tx.pure.u64(budget * 1000000),
        tx.pure.string(token),
        tx.pure.string(scope),
        tx.pure.u64(expiryTimestamp),
        tx.pure.u64(riskCeiling),
        tx.pure.u64(slippageGuardBps),
        tx.pure.u64(maxSingleTx * 1000000),
        tx.pure.address(beneficiary || keypair.getPublicKey().toSuiAddress()),
        tx.pure.address(daoOverride || keypair.getPublicKey().toSuiAddress()),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    const policyObject = result.objectChanges?.find(
      (o) => o.type === "created" && (o as any).objectType?.includes("PolicyObject")
    );

    const policyId = (policyObject as any)?.objectId ?? result.digest;
    const txDigest = result.digest;

    console.log(`[Deploy API] Real deployment successful — policyId: ${policyId}`);

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
