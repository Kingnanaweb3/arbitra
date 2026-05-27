import { NextRequest, NextResponse } from "next/server";
import { CoreClient as SuiClient } from "@mysten/sui/client";
const getFullnodeUrl = (network: string) => `https://fullnode.${network}.sui.io:443`;

const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
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

    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::activity_log::ActionLogged`,
      },
      limit: 50,
      order: "descending",
    });

    const filtered = (events.data ?? []).filter((e: any) =>
      e.parsedJson?.policy_id === policyId
    );

    const logs = filtered.map((e: any) => {
      const j = e.parsedJson;
      const timestamp = Number(e.timestampMs ?? Date.now());
      const date = new Date(timestamp);
      const time = date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      return {
        time,
        action: j.action_type ?? "ACTION",
        amount: Number(j.amount ?? 0) / 1000000,
        token,
        target: j.target ?? "",
        status: j.approved ? "approved" : "rejected",
        reason: j.reason ?? "",
        policyVersion: `v${j.policy_version ?? "1.0"}`,
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
