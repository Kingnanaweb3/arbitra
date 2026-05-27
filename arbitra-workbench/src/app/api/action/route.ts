import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, amount, riskScore, slippageBps } = body;

    console.log(`[Arbitra API] Action request: ${action} ${amount} USDC | Risk: ${riskScore} | Slippage: ${slippageBps}bps`);

    // Read policy from request headers or use defaults
    const budget = 200;
    const riskCeiling = 75;
    const slippageGuard = 250;
    const maxSingleTx = 50;
    const budgetUsed = 48;
    const budgetRemaining = budget - budgetUsed;

    // Policy enforcement checks
    const checks = {
      budgetCheck: amount <= budgetRemaining,
      riskCheck: riskScore <= riskCeiling,
      slippageCheck: slippageBps <= slippageGuard,
      maxTxCheck: amount <= maxSingleTx,
      actionValid: ["BUY", "SELL", "SKIP", "TRANSFER"].includes(action),
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
  });
}
