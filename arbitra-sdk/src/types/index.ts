// ── Network ──────────────────────────────────────────────
export type Network = "testnet" | "mainnet" | "devnet" | "localnet";

// ── Agent Types ──────────────────────────────────────────
export type AgentType =
  | "trading"
  | "ecommerce"
  | "treasury"
  | "payments"
  | "gaming"
  | "custom";

// ── Scope ────────────────────────────────────────────────
export type Scope = "deepbook" | "custom";

// ── Policy Status ─────────────────────────────────────────
export type PolicyStatus = "active" | "paused" | "revoked" | "expired";

// ── Policy Config ─────────────────────────────────────────
export interface PolicyConfig {
  agentName: string;
  agentType: AgentType;
  budget: number;
  token: string;
  scope: Scope;
  customScopeAddress?: string;
  expiryMs: number;
  riskCeiling: number;
  slippageGuardBps: number;
  maxSingleTx: number;
  beneficiary?: string;
  daoOverride?: string;
}

// ── Deployed Policy ───────────────────────────────────────
export interface DeployedPolicy {
  policyId: string;
  activityLogId: string;
  riskParamsId: string;
  packageId: string;
  owner: string;
  config: PolicyConfig;
  deployedAt: number;
  txDigest: string;
}

// ── Action Request ────────────────────────────────────────
export interface ActionRequest {
  type: string;
  amount: number;
  scope: Scope;
  riskScore: number;
  slippageBps: number;
  ptbDigest?: string;
}

// ── Action Result ─────────────────────────────────────────
export interface ActionResult {
  approved: boolean;
  txDigest?: string;
  reason?: string;
  budgetRemaining: number;
  riskScore: number;
  policyVersion: number;
  timestamp: number;
}

// ── Policy Status Result ──────────────────────────────────
export interface PolicyStatusResult {
  policyId: string;
  status: PolicyStatus;
  budgetTotal: number;
  budgetRemaining: number;
  budgetUsedPercent: number;
  riskCeiling: number;
  currentRiskScore: number;
  slippageGuardBps: number;
  maxSingleTx: number;
  totalActions: number;
  totalApproved: number;
  totalRejected: number;
  policyVersion: number;
  expiryMs: number;
  expiryRemainingMs: number;
  owner: string;
  isActive: boolean;
  isPaused: boolean;
  isRevoked: boolean;
}

// ── Risk Score Result ─────────────────────────────────────
export interface RiskScoreResult {
  aggregate: number;
  volatilityScore: number;
  oracleScore: number;
  depthScore: number;
  shouldPause: boolean;
  isStressTestActive: boolean;
  timestamp: number;
}

// ── Activity Log Entry ────────────────────────────────────
export interface LogEntry {
  entryType: number;
  actionLabel: string;
  amount: number;
  riskScore: number;
  slippageBps: number;
  rejectionReason: number;
  policyVersion: number;
  timestampMs: number;
  actor: string;
}

// ── Arbitra Client Config ───────────────────────────────────
export interface ArbitraClientConfig {
  network: Network;
  packageId: string;
  privateKey?: string;
  rpcUrl?: string;
}

// ── Error Codes ───────────────────────────────────────────
export enum ArbitraErrorCode {
  BUDGET_EXCEEDED = 1,
  SCOPE_VIOLATION = 2,
  POLICY_EXPIRED = 3,
  RISK_CEILING_BREACHED = 4,
  NOT_OWNER = 5,
  POLICY_REVOKED = 6,
  SLIPPAGE_EXCEEDED = 7,
  TX_LIMIT_EXCEEDED = 8,
  NOT_AUTHORIZED = 1,
  INVALID_WEIGHT = 2,
  INVALID_THRESHOLD = 3,
}

// ── Error Messages ────────────────────────────────────────
export const ArbitraErrorMessages: Record<number, string> = {
  1: "Budget exceeded — agent cannot spend more than the policy allows",
  2: "Scope violation — agent attempted to act outside its defined scope",
  3: "Policy expired — the policy has passed its expiry time",
  4: "Risk ceiling breached — market conditions too dangerous to act",
  5: "Not owner — only the policy owner or DAO can perform this action",
  6: "Policy revoked — this policy has been permanently terminated",
  7: "Slippage exceeded — trade skipped due to excessive slippage",
  8: "Transaction limit exceeded — amount exceeds max single transaction",
};
