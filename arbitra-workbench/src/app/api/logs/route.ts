import { NextRequest, NextResponse } from "next/server";
import { CoreClient as SuiClient } from "@mysten/sui/client";

const getFullnodeUrl = (network: string) => `https://fullnode.${network}.sui.io:443`;
const suiClient = new SuiClient({ url: getFullnodeUrl("testnet"), network: "testnet" });
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID ?? "0x8d2d740caccc02db4643f6ebccada30e0b029fb6274fdb9ffed04fed3ad3e53c";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const policyId = searchParams.get("policyId");
    const token = searchParams.get("token") ?? "USDC";
    const budget = Number(searchParams.get("budget") ?? 200);
    const statsOnly = searchParams.get("statsOnly") === "true";

    if (!policyId) {
      return NextResponse.json({ logs: [], stats: null });
    }

    // Query ActionApproved events
    const approvedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::policy_object::ActionApproved`,
      },
      limit: 50,
      order: "descending",
    });

    // Query ActionRejected events  
    const rejectedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::policy_object::ActionRejected`,
      },
      limit: 50,
      order: "descending",
    });

    const allEvents = [
      ...(approvedEvents.data ?? []).map((e: any) => ({ ...e, approved: true })),
      ...(rejectedEvents.data ?? []).map((e: any) => ({ ...e, approved: false })),
    ]
      .filter((e: any) => e.parsedJson?.policy_id === policyId)
      .sort((a: any, b: any) => Number(b.timestampMs) - Number(a.timestampMs));

    const logs = allEvents.map((e: any) => {
      const j = e.parsedJson;
      const timestamp = Number(e.timestampMs ?? Date.now());
      const date = new Date(timestamp);
      const time = date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const actionLabel = j.action_type
        ? new TextDecoder().decode(new Uint8Array(j.action_type))
        : "ACTION";

      return {
        time,
        action: actionLabel,
        amount: Number(j.amount ?? 0) / 1_000_000,
        token,
        target: j.policy_id ?? "",
        status: e.approved ? "approved" : "rejected",
        reason: "",
        policyVersion: "v1.0",
        txHash: e.id?.txDigest ?? "",
      };
    });

    if (statsOnly) {
      const approved = logs.filter((l: any) => l.status === "approved").length;
      const rejected = logs.filter((l: any) => l.status === "rejected").length;
      const approvedLogs = logs.filter((l: any) => l.status === "approved" && l.amount > 0);
      const totalSpent = approvedLogs.reduce((sum: number, l: any) => sum + l.amount, 0);
      const avgSize = approvedLogs.length > 0 ? Math.round(totalSpent / approvedLogs.length) : 0;
      const budgetUsedPercent = Math.round((totalSpent / budget) * 100);

      return NextResponse.json({
        stats: {
          approved,
          rejected,
          avgSize: `${avgSize} ${token}`,
          totalVolume: `${Math.round(totalSpent)} ${token}`,
          budgetUsed: `${Math.round(totalSpent)} ${token}`,
          budgetRemaining: `${Math.round(budget - totalSpent)} ${token}`,
          budgetUsedPercent,
        }
      });
    }

    return NextResponse.json({ logs });

  } catch (error: any) {
    console.error("[Logs API] Error:", error.message);
    return NextResponse.json({ logs: [], stats: null });
  }
}
