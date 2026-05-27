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




