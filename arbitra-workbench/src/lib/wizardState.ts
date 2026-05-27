export const ALL_AEGIS_ACTION_TYPES = [
  "BUY", "SELL", "SKIP", "PURCHASE", "TRANSFER",
  "MINT", "BID", "PAY", "GRANT", "INVOICE",
  "SUBSCRIBE", "STAKE", "UNSTAKE", "SWAP",
  "DEPOSIT", "WITHDRAW", "APPROVE", "REJECT",
];

export type AgentType = "trading" | "ecommerce" | "treasury" | "payments" | "gaming" | "custom";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface WizardState {
  step: WizardStep;
  agentType: AgentType | null;
  agentName: string;
  agentDescription: string;
  agentIcon: string;
  agentTag: string;
  connectionType: "own" | "demo" | null;
  endpointUrl: string;
  authType: "bearer" | "apikey" | "none";
  authKey: string;
  authValue: string;
  connectionStatus: "idle" | "testing" | "connected" | "failed";
  actionMappings: { agentAction: string; arbitraType: string }[];
  strategy: "dca" | "momentum";
  tradingPair: string;
  executionInterval: string;
  budget: number;
  token: string;
  scope: "deepbook" | "custom";
  customScopeAddress: string;
  expiry: string;
  riskCeiling: number;
  slippageGuardBps: number;
  maxSingleTx: number;
  beneficiaryAddress: string;
  daoOverrideAddress: string;
  template: "conservative" | "balanced" | "aggressive" | "custom";
  weeklyReset: boolean;
  splitAddresses: { address: string; amount: number }[];  // initialized in defaultWizardState
  recipientWhitelist: string[];
  paymentSchedule: string;
  marketplaceAddress: string;
  subscriptionEnabled: boolean;
  subscriptionAmount: number;
  subscriptionInterval: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  subscriptionRecipient: string;
}

export const agentActionDefaults: Record<string, { agentAction: string; arbitraType: string }[]> = {
  trading: [
    { agentAction: "buy", arbitraType: "BUY" },
    { agentAction: "sell", arbitraType: "SELL" },
    { agentAction: "hold", arbitraType: "SKIP" },
  ],
  ecommerce: [
    { agentAction: "purchase", arbitraType: "PURCHASE" },
    { agentAction: "skip", arbitraType: "SKIP" },
    { agentAction: "return", arbitraType: "TRANSFER" },
  ],
  treasury: [
    { agentAction: "send_grant", arbitraType: "PAY" },
    { agentAction: "hold", arbitraType: "SKIP" },
    { agentAction: "refund", arbitraType: "TRANSFER" },
  ],
  payments: [
    { agentAction: "pay", arbitraType: "PAY" },
    { agentAction: "skip", arbitraType: "SKIP" },
    { agentAction: "refund", arbitraType: "TRANSFER" },
  ],
  gaming: [
    { agentAction: "mint", arbitraType: "MINT" },
    { agentAction: "bid", arbitraType: "BID" },
    { agentAction: "skip", arbitraType: "SKIP" },
  ],
  custom: [
    { agentAction: "", arbitraType: "BUY" },
  ],
};

export const agentDemoConfig: Record<string, {
  strategies?: string[];
  defaultStrategy?: string;
  tradingPairs?: string[];
  intervals?: string[];
  schedules?: string[];
  showVendorInput?: boolean;
  showMarketplaceInput?: boolean;
  showPaymentSchedule?: boolean;
  showTradingConfig?: boolean;
  label: string;
  actionNote: string;
}> = {
  trading: {
    showTradingConfig: true,
    strategies: ["dca", "momentum"],
    defaultStrategy: "dca",
    tradingPairs: ["SUI/USDC", "SUI/USDT", "DEEP/USDC"],
    intervals: ["5", "7", "15", "30"],
    label: "Trading Strategy",
    actionNote: "Your agent will execute trades on Deepbook. Map your trade signals to Arbitra action types.",
  },
  ecommerce: {
    showVendorInput: true,
    label: "Purchase Settings",
    actionNote: "Your agent will purchase goods. Map your purchase actions to Arbitra types.",
  },
  treasury: {
    showPaymentSchedule: true,
    schedules: ["on-demand", "weekly", "monthly"],
    label: "Payment Settings",
    actionNote: "Your agent will manage treasury payments. Map your payment actions to Arbitra types.",
  },
  payments: {
    showPaymentSchedule: true,
    schedules: ["on-demand", "weekly", "monthly"],
    label: "Payment Settings",
    actionNote: "Your agent will handle invoices and payroll. Map your payment actions to Arbitra types.",
  },
  gaming: {
    showMarketplaceInput: true,
    label: "Marketplace Settings",
    actionNote: "Your agent will manage in-game purchases. Map your game actions to Arbitra types.",
  },
  custom: {
    label: "Custom Settings",
    actionNote: "Define your own action types. Map them to Arbitra enforcement types below.",
  },
};

export const defaultWizardState: WizardState = {
  step: 1,
  agentType: null,
  agentName: "",
  agentDescription: "",
  agentIcon: "ti-robot",
  agentTag: "",
  connectionType: null,
  endpointUrl: "",
  authType: "bearer",
  authKey: "Authorization",
  authValue: "",
  connectionStatus: "idle",
  actionMappings: [
    { agentAction: "buy", arbitraType: "BUY" },
    { agentAction: "sell", arbitraType: "SELL" },
    { agentAction: "hold", arbitraType: "SKIP" },
  ],
  strategy: "dca",
  tradingPair: "SUI/USDC",
  executionInterval: "7",
  budget: 200,
  token: "USDC",
  scope: "deepbook",
  customScopeAddress: "",
  expiry: "24",
  riskCeiling: 75,
  slippageGuardBps: 250,
  maxSingleTx: 50,
  beneficiaryAddress: "",
  daoOverrideAddress: "",
  template: "balanced",
  weeklyReset: false,
  splitAddresses: [{ address: "", amount: 0 }],
  recipientWhitelist: [""],
  paymentSchedule: "on-demand",
  marketplaceAddress: "",
  subscriptionEnabled: false,
  subscriptionAmount: 0,
  subscriptionInterval: "monthly",
  subscriptionStartDate: "",
  subscriptionEndDate: "",
  subscriptionRecipient: "",
};

export const agentTypeConfig: Record<AgentType, {
  icon: string;
  color: string;
  borderColor: string;
  label: string;
  desc: string;
  policyFields: string[];
}> = {
  trading: {
    icon: "ti-trending-up",
    color: "#60a5fa",
    borderColor: "#2563eb",
    label: "Trading Agent",
    desc: "Execute trades on Sui DEXes with a live risk guardian and budget cap.",
    policyFields: ["riskCeiling", "slippageGuardBps", "maxSingleTx", "tradingPair"],
  },
  ecommerce: {
    icon: "ti-shopping-cart",
    color: "#f59e0b",
    borderColor: "#d97706",
    label: "E-Commerce Agent",
    desc: "Purchase goods from approved vendors within a capped weekly budget.",
    policyFields: ["budget", "maxSingleTx", "vendorWhitelist"],
  },
  treasury: {
    icon: "ti-building-bank",
    color: "#60a5fa",
    borderColor: "#2563eb",
    label: "DAO Treasury",
    desc: "Handle recurring grants and payments within governance limits.",
    policyFields: ["budget", "maxSingleTx", "recipientWhitelist", "daoOverrideAddress"],
  },
  payments: {
    icon: "ti-credit-card",
    color: "#a78bfa",
    borderColor: "#7c3aed",
    label: "Payments Agent",
    desc: "Automate invoices, payroll, and subscriptions with full audit trail.",
    policyFields: ["budget", "maxSingleTx", "approvedPayees"],
  },
  gaming: {
    icon: "ti-device-gamepad-2",
    color: "#34d399",
    borderColor: "#059669",
    label: "Gaming Agent",
    desc: "Manage in-game asset purchases and bids within spend limits.",
    policyFields: ["budget", "maxSingleTx", "approvedMarketplace"],
  },
  custom: {
    icon: "ti-settings-2",
    color: "#94a3b8",
    borderColor: "#475569",
    label: "Custom Agent",
    desc: "Define your own action types, scope, and policy parameters from scratch.",
    policyFields: ["budget", "maxSingleTx", "scope"],
  },
};

export const templateConfigs = {
  conservative: { budget: 100, riskCeiling: 50, slippageGuardBps: 150, maxSingleTx: 25, expiry: "12" },
  balanced: { budget: 200, riskCeiling: 75, slippageGuardBps: 250, maxSingleTx: 50, expiry: "24" },
  aggressive: { budget: 500, riskCeiling: 90, slippageGuardBps: 400, maxSingleTx: 100, expiry: "48" },
};
