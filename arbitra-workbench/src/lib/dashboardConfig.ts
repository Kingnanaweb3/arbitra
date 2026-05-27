export interface QuickAction {
  label: string;
  icon: string;
  color?: string;
  action: string;
}

export interface DashboardConfig {
  gaugeLabel: string;
  gaugeMetrics: { label: string; key: string }[];
  filterTabs: string[];
  stats: { label: string; key: string; color?: string }[];
  quickActions: QuickAction[];
  templateTabs: string[];
  warningButton: { label: string; icon: string; color: string } | null;
  policyFields: { label: string; key: string; type: "text" | "number" | "list" | "toggle" | "address" }[];
  logActionColors: Record<string, string>;
  agentBarLabel: (data: any) => string;
}

export const dashboardConfig: Record<string, DashboardConfig> = {
  trading: {
    gaugeLabel: "RISK SCORE",
    gaugeMetrics: [
      { label: "Volatility", key: "volatility" },
      { label: "Oracle Confidence", key: "oracle" },
      { label: "Order Depth", key: "depth" },
    ],
    filterTabs: ["All", "Buys", "Sells", "Skipped", "Paused", "System"],
    stats: [
      { label: "Trades Approved", key: "approved" },
      { label: "Trades Rejected", key: "rejected" },
      { label: "Avg Trade Size", key: "avgSize" },
      { label: "Total Volume", key: "totalVolume" },
      { label: "Budget Used", key: "budgetUsed" },
      { label: "Risk Ceiling", key: "riskCeiling" },
    ],
    quickActions: [
      { label: "Stress Test", icon: "ti-bolt", color: "#f59e0b", action: "stress_test" },
      { label: "Update Risk Params", icon: "ti-adjustments", color: "#60a5fa", action: "update_risk" },
      { label: "Pause Agent", icon: "ti-player-pause", color: "#94a3b8", action: "pause" },
    ],
    templateTabs: ["Conservative", "Balanced", "Aggressive"],
    warningButton: { label: "Stress Test", icon: "ti-bolt", color: "#f59e0b" },
    policyFields: [
      { label: "Budget", key: "budget", type: "number" },
      { label: "Trading Pair", key: "tradingPair", type: "text" },
      { label: "Risk Ceiling", key: "riskCeiling", type: "number" },
      { label: "Slippage Guard", key: "slippageGuardBps", type: "number" },
      { label: "Max Per Tx", key: "maxSingleTx", type: "number" },
      { label: "Scope", key: "scope", type: "text" },
      { label: "Expiry", key: "expiry", type: "text" },
    ],
    logActionColors: {
      BUY: "#60a5fa",
      SELL: "#a78bfa",
      SKIP: "#475569",
      PAUSED: "#ef4444",
      RESUMED: "#22c55e",
      REJECTED: "#ef4444",
    },
    agentBarLabel: (d) => `Risk: ${d.currentRisk ?? 44}`,
  },

  ecommerce: {
    gaugeLabel: "SPEND HEALTH",
    gaugeMetrics: [
      { label: "Spend Velocity", key: "spendVelocity" },
      { label: "Vendor Compliance", key: "vendorCompliance" },
      { label: "Receipt Coverage", key: "receiptCoverage" },
    ],
    filterTabs: ["All", "Purchases", "Rejected", "Warnings", "System"],
    stats: [
      { label: "Purchases Approved", key: "approved" },
      { label: "Purchases Rejected", key: "rejected" },
      { label: "Avg Purchase Size", key: "avgSize" },
      { label: "Largest Single Spend", key: "largestSpend", color: "#ef4444" },
      { label: "Total Saved by Policy", key: "totalSaved", color: "#22c55e" },
      { label: "Weekly Budget Used", key: "budgetUsed" },
    ],
    quickActions: [
      { label: "Add Vendor", icon: "ti-plus", color: "#60a5fa", action: "add_vendor" },
      { label: "Update Spend Limit", icon: "ti-currency-dollar", color: "#60a5fa", action: "update_limit" },
      { label: "Pause Agent", icon: "ti-player-pause", color: "#94a3b8", action: "pause" },
    ],
    templateTabs: ["Cautious Buyer", "Standard", "High Volume"],
    warningButton: { label: "Budget Warning", icon: "ti-alert-triangle", color: "#f59e0b" },
    policyFields: [
      { label: "Weekly Budget", key: "budget", type: "number" },
      { label: "Max Per Transaction", key: "maxSingleTx", type: "number" },
      { label: "Approved Vendors", key: "splitAddresses", type: "list" },
      { label: "Blocked Categories", key: "blockedCategories", type: "list" },
      { label: "Receipt Logging", key: "receiptLogging", type: "toggle" },
      { label: "Expiry", key: "expiry", type: "text" },
    ],
    logActionColors: {
      PURCHASE: "#60a5fa",
      SKIP: "#475569",
      TRANSFER: "#a78bfa",
      REJECTED: "#ef4444",
      PAUSED: "#f59e0b",
      WARNING: "#f59e0b",
    },
    agentBarLabel: (d) => `Spend: ${d.budgetUsedPercent ?? 73}%`,
  },

  treasury: {
    gaugeLabel: "ALLOCATION HEALTH",
    gaugeMetrics: [
      { label: "Grant Velocity", key: "grantVelocity" },
      { label: "Recipient Compliance", key: "recipientCompliance" },
      { label: "Budget Utilization", key: "budgetUtilization" },
    ],
    filterTabs: ["All", "Grants", "Transfers", "Rejected", "System"],
    stats: [
      { label: "Grants Approved", key: "approved" },
      { label: "Grants Rejected", key: "rejected" },
      { label: "Avg Grant Size", key: "avgSize" },
      { label: "Total Distributed", key: "totalVolume" },
      { label: "Monthly Allocation Used", key: "budgetUsed" },
      { label: "Remaining Allocation", key: "budgetRemaining", color: "#22c55e" },
    ],
    quickActions: [
      { label: "Add Recipient", icon: "ti-user-plus", color: "#60a5fa", action: "add_recipient" },
      { label: "Update Allocation", icon: "ti-adjustments", color: "#60a5fa", action: "update_allocation" },
      { label: "Pause Agent", icon: "ti-player-pause", color: "#94a3b8", action: "pause" },
    ],
    templateTabs: ["Conservative", "Standard", "Open"],
    warningButton: null,
    policyFields: [
      { label: "Monthly Allocation", key: "budget", type: "number" },
      { label: "Max Single Grant", key: "maxSingleTx", type: "number" },
      { label: "Recipient Whitelist", key: "recipientWhitelist", type: "list" },
      { label: "Payment Schedule", key: "paymentSchedule", type: "text" },
      { label: "DAO Override", key: "daoOverrideAddress", type: "address" },
      { label: "Expiry", key: "expiry", type: "text" },
    ],
    logActionColors: {
      PAY: "#60a5fa",
      GRANT: "#22c55e",
      TRANSFER: "#a78bfa",
      SKIP: "#475569",
      REJECTED: "#ef4444",
      PAUSED: "#f59e0b",
    },
    agentBarLabel: (d) => `Allocation: ${d.budgetUsedPercent ?? 68}%`,
  },

  payments: {
    gaugeLabel: "PAYMENT HEALTH",
    gaugeMetrics: [
      { label: "Payment Velocity", key: "paymentVelocity" },
      { label: "Payee Compliance", key: "payeeCompliance" },
      { label: "Schedule Adherence", key: "scheduleAdherence" },
    ],
    filterTabs: ["All", "Payments", "Subscriptions", "Rejected", "System"],
    stats: [
      { label: "Payments Approved", key: "approved" },
      { label: "Payments Rejected", key: "rejected" },
      { label: "Avg Payment Size", key: "avgSize" },
      { label: "Subscriptions Active", key: "subscriptionsActive" },
      { label: "Total Paid Out", key: "totalVolume" },
      { label: "Budget Remaining", key: "budgetRemaining", color: "#22c55e" },
    ],
    quickActions: [
      { label: "Add Payee", icon: "ti-user-plus", color: "#60a5fa", action: "add_payee" },
      { label: "Update Budget", icon: "ti-currency-dollar", color: "#60a5fa", action: "update_budget" },
      { label: "Pause Agent", icon: "ti-player-pause", color: "#94a3b8", action: "pause" },
    ],
    templateTabs: ["Conservative", "Standard", "High Frequency"],
    warningButton: null,
    policyFields: [
      { label: "Budget", key: "budget", type: "number" },
      { label: "Max Single Payment", key: "maxSingleTx", type: "number" },
      { label: "Approved Payees", key: "recipientWhitelist", type: "list" },
      { label: "Payment Schedule", key: "paymentSchedule", type: "text" },
      { label: "Subscription", key: "subscriptionEnabled", type: "toggle" },
      { label: "Expiry", key: "expiry", type: "text" },
    ],
    logActionColors: {
      PAY: "#60a5fa",
      SUBSCRIBE: "#22c55e",
      INVOICE: "#a78bfa",
      SKIP: "#475569",
      REJECTED: "#ef4444",
      PAUSED: "#f59e0b",
    },
    agentBarLabel: (d) => `Paid: ${d.budgetUsedPercent ?? 45}%`,
  },

  gaming: {
    gaugeLabel: "SPEND HEALTH",
    gaugeMetrics: [
      { label: "Bid Velocity", key: "bidVelocity" },
      { label: "Marketplace Compliance", key: "marketplaceCompliance" },
      { label: "Budget Utilization", key: "budgetUtilization" },
    ],
    filterTabs: ["All", "Mints", "Bids", "Rejected", "System"],
    stats: [
      { label: "Actions Approved", key: "approved" },
      { label: "Actions Rejected", key: "rejected" },
      { label: "Avg Bid Size", key: "avgSize" },
      { label: "Largest Single Bid", key: "largestSpend" },
      { label: "Total Spent", key: "totalVolume" },
      { label: "Budget Remaining", key: "budgetRemaining", color: "#22c55e" },
    ],
    quickActions: [
      { label: "Update Budget", icon: "ti-currency-dollar", color: "#60a5fa", action: "update_budget" },
      { label: "Update Marketplace", icon: "ti-building-store", color: "#60a5fa", action: "update_marketplace" },
      { label: "Pause Agent", icon: "ti-player-pause", color: "#94a3b8", action: "pause" },
    ],
    templateTabs: ["Casual", "Standard", "Competitive"],
    warningButton: null,
    policyFields: [
      { label: "Budget", key: "budget", type: "number" },
      { label: "Max Single Bid", key: "maxSingleTx", type: "number" },
      { label: "Approved Marketplace", key: "marketplaceAddress", type: "address" },
      { label: "Risk Ceiling", key: "riskCeiling", type: "number" },
      { label: "Expiry", key: "expiry", type: "text" },
    ],
    logActionColors: {
      MINT: "#22c55e",
      BID: "#60a5fa",
      APPROVE: "#a78bfa",
      SKIP: "#475569",
      REJECTED: "#ef4444",
      PAUSED: "#f59e0b",
    },
    agentBarLabel: (d) => `Spent: ${d.budgetUsedPercent ?? 30}%`,
  },

  custom: {
    gaugeLabel: "POLICY HEALTH",
    gaugeMetrics: [
      { label: "Action Velocity", key: "actionVelocity" },
      { label: "Scope Compliance", key: "scopeCompliance" },
      { label: "Budget Utilization", key: "budgetUtilization" },
    ],
    filterTabs: ["All", "Approved", "Rejected", "Skipped", "System"],
    stats: [
      { label: "Actions Approved", key: "approved" },
      { label: "Actions Rejected", key: "rejected" },
      { label: "Avg Action Size", key: "avgSize" },
      { label: "Total Volume", key: "totalVolume" },
      { label: "Budget Used", key: "budgetUsed" },
      { label: "Budget Remaining", key: "budgetRemaining", color: "#22c55e" },
    ],
    quickActions: [
      { label: "Update Policy", icon: "ti-adjustments", color: "#60a5fa", action: "update_policy" },
      { label: "Update Risk Params", icon: "ti-shield", color: "#60a5fa", action: "update_risk" },
      { label: "Pause Agent", icon: "ti-player-pause", color: "#94a3b8", action: "pause" },
    ],
    templateTabs: ["Conservative", "Balanced", "Aggressive"],
    warningButton: null,
    policyFields: [
      { label: "Budget", key: "budget", type: "number" },
      { label: "Max Single Tx", key: "maxSingleTx", type: "number" },
      { label: "Scope", key: "scope", type: "text" },
      { label: "Risk Ceiling", key: "riskCeiling", type: "number" },
      { label: "Expiry", key: "expiry", type: "text" },
      { label: "DAO Override", key: "daoOverrideAddress", type: "address" },
    ],
    logActionColors: {
      BUY: "#60a5fa",
      SELL: "#a78bfa",
      PAY: "#22c55e",
      TRANSFER: "#a78bfa",
      SKIP: "#475569",
      REJECTED: "#ef4444",
      PAUSED: "#f59e0b",
    },
    agentBarLabel: (d) => `Used: ${d.budgetUsedPercent ?? 0}%`,
  },
};

export function getDashboardConfig(agentType: string): DashboardConfig {
  return dashboardConfig[agentType] ?? dashboardConfig.custom;
}

export interface MockLogEntry {
  time: string;
  action: string;
  amount: number;
  token: string;
  target: string;
  status: "approved" | "rejected" | "warning" | "paused" | "system";
  receipt?: string;
  reason?: string;
  policyVersion: string;
}

export function getMockLogs(agentType: string, token: string): MockLogEntry[] {
  const logs: Record<string, MockLogEntry[]> = {
    trading: [
      { time: "12:34:01", action: "BUY", amount: 12, token, target: "SUI/USDC", status: "approved", policyVersion: "v1.0" },
      { time: "12:41:08", action: "BUY", amount: 12, token, target: "SUI/USDC", status: "approved", policyVersion: "v1.0" },
      { time: "12:48:15", action: "BUY", amount: 12, token, target: "SUI/USDC", status: "approved", policyVersion: "v1.0" },
      { time: "12:55:22", action: "PAUSED", amount: 0, token, target: "Risk spike", status: "paused", reason: "Risk score 90 > ceiling 75", policyVersion: "v1.0" },
      { time: "13:02:30", action: "RESUMED", amount: 0, token, target: "Risk normalized", status: "approved", reason: "Risk score 61 < ceiling 75", policyVersion: "v1.0" },
      { time: "13:09:37", action: "BUY", amount: 12, token, target: "SUI/USDC", status: "approved", policyVersion: "v1.0" },
    ],
    ecommerce: [
      { time: "10:14:02", action: "PURCHASE", amount: 45, token, target: "vendor-one.sui", status: "approved", receipt: "#A1B2", policyVersion: "v1.0" },
      { time: "10:31:17", action: "PURCHASE", amount: 28, token, target: "vendor-two.sui", status: "approved", receipt: "#C3D4", policyVersion: "v1.0" },
      { time: "10:45:00", action: "WARNING", amount: 0, token, target: "73% of weekly limit used", status: "warning", policyVersion: "v1.0" },
      { time: "11:02:44", action: "REJECTED", amount: 0, token, target: "vendor-four.sui", status: "rejected", reason: "Not on approved vendor list", policyVersion: "v1.0" },
      { time: "11:15:30", action: "REJECTED", amount: 65, token, target: "vendor-one.sui", status: "rejected", reason: "Exceeds max transaction limit", policyVersion: "v1.0" },
      { time: "11:30:00", action: "PURCHASE", amount: 32, token, target: "vendor-one.sui", status: "approved", receipt: "#E5F6", policyVersion: "v1.0" },
    ],
    treasury: [
      { time: "09:00:00", action: "GRANT", amount: 500, token, target: "0x7b57...3e87", status: "approved", policyVersion: "v1.0" },
      { time: "09:30:00", action: "GRANT", amount: 250, token, target: "0x8c92...4f21", status: "approved", policyVersion: "v1.0" },
      { time: "10:00:00", action: "REJECTED", amount: 1500, token, target: "0x9d31...2a18", status: "rejected", reason: "Exceeds max single grant", policyVersion: "v1.0" },
      { time: "10:30:00", action: "TRANSFER", amount: 100, token, target: "0x2a18...9d31", status: "approved", policyVersion: "v1.0" },
      { time: "11:00:00", action: "GRANT", amount: 750, token, target: "0x4f21...8c92", status: "approved", policyVersion: "v1.0" },
    ],
    payments: [
      { time: "08:00:00", action: "PAY", amount: 200, token, target: "payee-one.sui", status: "approved", policyVersion: "v1.0" },
      { time: "08:30:00", action: "SUBSCRIBE", amount: 50, token, target: "service-one.sui", status: "approved", policyVersion: "v1.0" },
      { time: "09:00:00", action: "PAY", amount: 150, token, target: "payee-two.sui", status: "approved", policyVersion: "v1.0" },
      { time: "09:30:00", action: "REJECTED", amount: 500, token, target: "payee-three.sui", status: "rejected", reason: "Not on approved payees list", policyVersion: "v1.0" },
      { time: "10:00:00", action: "INVOICE", amount: 300, token, target: "vendor.sui", status: "approved", policyVersion: "v1.0" },
    ],
    gaming: [
      { time: "14:00:00", action: "BID", amount: 25, token, target: "NFT #1234", status: "approved", policyVersion: "v1.0" },
      { time: "14:15:00", action: "MINT", amount: 10, token, target: "Collection A", status: "approved", policyVersion: "v1.0" },
      { time: "14:30:00", action: "REJECTED", amount: 200, token, target: "NFT #5678", status: "rejected", reason: "Exceeds max single bid", policyVersion: "v1.0" },
      { time: "14:45:00", action: "BID", amount: 30, token, target: "NFT #9012", status: "approved", policyVersion: "v1.0" },
      { time: "15:00:00", action: "MINT", amount: 15, token, target: "Collection B", status: "approved", policyVersion: "v1.0" },
    ],
    custom: [
      { time: "10:00:00", action: "APPROVE", amount: 100, token, target: "0x7b57...3e87", status: "approved", policyVersion: "v1.0" },
      { time: "10:30:00", action: "TRANSFER", amount: 50, token, target: "0x8c92...4f21", status: "approved", policyVersion: "v1.0" },
      { time: "11:00:00", action: "REJECTED", amount: 200, token, target: "0x9d31...2a18", status: "rejected", reason: "Exceeds max single tx", policyVersion: "v1.0" },
      { time: "11:30:00", action: "SKIP", amount: 0, token, target: "Risk elevated", status: "system", policyVersion: "v1.0" },
    ],
  };
  return logs[agentType] ?? logs.custom;
}

export function getMockStats(agentType: string, budget: number, token: string) {
  const stats: Record<string, Record<string, any>> = {
    trading: { approved: 4, rejected: 1, avgSize: `12 ${token}`, totalVolume: `48 ${token}`, budgetUsed: `48 ${token}`, riskCeiling: "75 / 100", budgetUsedPercent: 24, currentRisk: 44 },
    ecommerce: { approved: 8, rejected: 2, avgSize: `45 ${token}`, largestSpend: `65 ${token}`, totalSaved: `65 ${token}`, budgetUsed: `365 ${token}`, budgetUsedPercent: 73, spendVelocity: "Normal", vendorCompliance: "100%", receiptCoverage: "100%" },
    treasury: { approved: 5, rejected: 1, avgSize: `500 ${token}`, totalVolume: `1600 ${token}`, budgetUsed: `1600 ${token}`, budgetRemaining: `${budget - 1600} ${token}`, budgetUsedPercent: 68 },
    payments: { approved: 5, rejected: 1, avgSize: `200 ${token}`, subscriptionsActive: 1, totalVolume: `700 ${token}`, budgetRemaining: `${budget - 700} ${token}`, budgetUsedPercent: 45 },
    gaming: { approved: 4, rejected: 1, avgSize: `20 ${token}`, largestSpend: `30 ${token}`, totalVolume: `80 ${token}`, budgetRemaining: `${budget - 80} ${token}`, budgetUsedPercent: 30 },
    custom: { approved: 3, rejected: 1, avgSize: `75 ${token}`, totalVolume: `150 ${token}`, budgetUsed: `150 ${token}`, budgetRemaining: `${budget - 150} ${token}`, budgetUsedPercent: 15 },
  };
  return stats[agentType] ?? stats.custom;
}
