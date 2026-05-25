// ── Arbitra SDK ─────────────────────────────────────────────
// The policy enforcement layer for AI agents on Sui
// Built by Kingnana — Sui Overflow 2026

import { ArbitraClient } from "./lib/client.js";
export { ArbitraClient };

export type {
  ArbitraClientConfig,
  PolicyConfig,
  DeployedPolicy,
  ActionRequest,
  ActionResult,
  PolicyStatusResult,
  RiskScoreResult,
  LogEntry,
  Network,
  AgentType,
  Scope,
  PolicyStatus,
} from "./types/index.js";

export {
  ArbitraErrorCode,
  ArbitraErrorMessages,
} from "./types/index.js";

// ── Package ID — deployed on Sui testnet ──────────────────
export const ARBITRA_PACKAGE_ID =
  "0x8d2d740caccc02db4643f6ebccada30e0b029fb6274fdb9ffed04fed3ad3e53c";

export const ARBITRA_TESTNET_CONFIG = {
  network: "testnet" as const,
  packageId: ARBITRA_PACKAGE_ID,
};

// ── Quick start helper ────────────────────────────────────
export function createArbitraClient(privateKey: string) {
  return new ArbitraClient({
    ...ARBITRA_TESTNET_CONFIG,
    privateKey,
  });
}
