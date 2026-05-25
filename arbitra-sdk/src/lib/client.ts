import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  ArbitraClientConfig,
  PolicyConfig,
  DeployedPolicy,
  ActionRequest,
  ActionResult,
  PolicyStatusResult,
  RiskScoreResult,
  ArbitraErrorMessages,
  Network,
} from "../types/index.js";

// ── Constants ─────────────────────────────────────────────
const SCOPE_DEEPBOOK = 1;
const SCOPE_CUSTOM = 2;
const CLOCK_OBJECT_ID = "0x6";

// ── Arbitra Client ──────────────────────────────────────────
export class ArbitraClient {
  private client: SuiJsonRpcClient;
  private keypair: Ed25519Keypair | null = null;
  private packageId: string;
  private network: Network;

  constructor(config: ArbitraClientConfig) {
    this.network = config.network;
    this.packageId = config.packageId;

    const rpcUrl = config.rpcUrl ?? getJsonRpcFullnodeUrl(config.network);
    this.client = new SuiJsonRpcClient({ url: rpcUrl, network: config.network });

    if (config.privateKey) {
      this.keypair = Ed25519Keypair.fromSecretKey(config.privateKey);
    }
  }

  // ── Get signer address ──────────────────────────────────
  getAddress(): string {
    if (!this.keypair) throw new Error("No keypair configured");
    return this.keypair.getPublicKey().toSuiAddress();
  }

  // ── Deploy a new policy ─────────────────────────────────
  async createPolicy(config: PolicyConfig): Promise<DeployedPolicy> {
    if (!this.keypair) throw new Error("No keypair configured for signing");

    const tx = new Transaction();

    const scopeValue = config.scope === "deepbook" ? SCOPE_DEEPBOOK : SCOPE_CUSTOM;
    const customScopeAddress = config.customScopeAddress ?? "0x0000000000000000000000000000000000000000000000000000000000000000";
    const beneficiary = config.beneficiary ?? this.getAddress();
    const daoOverride = config.daoOverride ?? this.getAddress();

    // Call create_policy on the Move contract
    const [policyCap] = tx.moveCall({
      target: `${this.packageId}::policy_object::create_policy`,
      arguments: [
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(config.agentName))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(config.agentType))),
        tx.pure.u64(config.budget),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(config.token))),
        tx.pure.u8(scopeValue),
        tx.pure.address(customScopeAddress),
        tx.pure.u64(config.expiryMs),
        tx.pure.u64(config.riskCeiling),
        tx.pure.u64(config.slippageGuardBps),
        tx.pure.u64(config.maxSingleTx),
        tx.pure.address(beneficiary),
        tx.pure.address(daoOverride),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });

    // Transfer cap to owner
    tx.transferObjects([policyCap], this.getAddress());

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    if (result.effects?.status.status !== "success") {
      throw new Error(`Policy deployment failed: ${result.effects?.status.error}`);
    }

    // Extract created object IDs
    const createdObjects = result.objectChanges?.filter(
      (obj: any) => obj.type === "created"
    ) ?? [];

    const policyObject = createdObjects.find(
      (obj: any) => obj.type === "created" && "objectType" in obj &&
      obj.objectType.includes("policy_object::PolicyObject")
    );

    const policyId = policyObject && "objectId" in policyObject
      ? policyObject.objectId
      : "";

    console.log("✓ Policy deployed on-chain");
    console.log(`  Policy ID: ${policyId}`);
    console.log(`  Tx Digest: ${result.digest}`);

    return {
      policyId,
      activityLogId: "",
      riskParamsId: "",
      packageId: this.packageId,
      owner: this.getAddress(),
      config,
      deployedAt: Date.now(),
      txDigest: result.digest,
    };
  }

  // ── Validate action before execution ───────────────────
  async validateAction(
    policyId: string,
    request: ActionRequest
  ): Promise<ActionResult> {
    if (!this.keypair) throw new Error("No keypair configured for signing");

    const scopeValue = request.scope === "deepbook" ? SCOPE_DEEPBOOK : SCOPE_CUSTOM;

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::policy_object::validate_action`,
      arguments: [
        tx.object(policyId),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(request.type))),
        tx.pure.u64(request.amount),
        tx.pure.u8(scopeValue),
        tx.pure.u64(request.riskScore),
        tx.pure.u64(request.slippageBps),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });

    try {
      const result = await this.client.signAndExecuteTransaction({
        transaction: tx,
        signer: this.keypair,
        options: { showEffects: true, showEvents: true },
      });

      const success = result.effects?.status.status === "success";

      // Wait for finality before reading state
      await this.client.waitForTransaction({ digest: result.digest });
      const policy = await this.getPolicyStatus(policyId);

      return {
        approved: success,
        txDigest: result.digest,
        budgetRemaining: policy.budgetRemaining,
        riskScore: request.riskScore,
        policyVersion: policy.policyVersion,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      const errorCode = this.parseErrorCode(error.message);
      return {
        approved: false,
        reason: ArbitraErrorMessages[errorCode] ?? error.message,
        budgetRemaining: 0,
        riskScore: request.riskScore,
        policyVersion: 0,
        timestamp: Date.now(),
      };
    }
  }

  // ── Revoke policy ───────────────────────────────────────
  async revokePolicy(policyId: string, capId: string): Promise<string> {
    if (!this.keypair) throw new Error("No keypair configured for signing");

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::policy_object::revoke_policy`,
      arguments: [
        tx.object(policyId),
        tx.object(capId),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
      options: { showEffects: true },
    });

    if (result.effects?.status.status !== "success") {
      throw new Error(`Revocation failed: ${result.effects?.status.error}`);
    }

    console.log("✓ Policy revoked on-chain");
    console.log(`  Tx Digest: ${result.digest}`);

    return result.digest;
  }

  // ── Pause policy ────────────────────────────────────────
  async pausePolicy(policyId: string, riskScore: number): Promise<string> {
    if (!this.keypair) throw new Error("No keypair configured for signing");

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::policy_object::pause_policy`,
      arguments: [
        tx.object(policyId),
        tx.pure.u64(riskScore),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
      options: { showEffects: true },
    });

    if (result.effects?.status.status !== "success") {
      throw new Error(`Pause failed: ${result.effects?.status.error}`);
    }

    console.log(`✓ Agent paused on-chain — Risk score: ${riskScore}`);
    return result.digest;
  }

  // ── Resume policy ───────────────────────────────────────
  async resumePolicy(policyId: string, riskScore: number): Promise<string> {
    if (!this.keypair) throw new Error("No keypair configured for signing");

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::policy_object::resume_policy`,
      arguments: [
        tx.object(policyId),
        tx.pure.u64(riskScore),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
      options: { showEffects: true },
    });

    if (result.effects?.status.status !== "success") {
      throw new Error(`Resume failed: ${result.effects?.status.error}`);
    }

    console.log(`✓ Agent resumed on-chain — Risk score: ${riskScore}`);
    return result.digest;
  }

  // ── Update risk params ──────────────────────────────────
  async updateRiskParams(
    policyId: string,
    newRiskCeiling: number,
    newSlippageBps: number,
    newMaxTx: number
  ): Promise<string> {
    if (!this.keypair) throw new Error("No keypair configured for signing");

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::policy_object::update_risk_params`,
      arguments: [
        tx.object(policyId),
        tx.pure.u64(newRiskCeiling),
        tx.pure.u64(newSlippageBps),
        tx.pure.u64(newMaxTx),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
      options: { showEffects: true },
    });

    if (result.effects?.status.status !== "success") {
      throw new Error(`Update failed: ${result.effects?.status.error}`);
    }

    console.log(`✓ Risk params updated on-chain`);
    console.log(`  New ceiling: ${newRiskCeiling}`);
    return result.digest;
  }

  // ── Get policy status ───────────────────────────────────
  async getPolicyStatus(policyId: string): Promise<PolicyStatusResult> {
    const object = await this.client.getObject({
      id: policyId,
      options: { showContent: true },
    });

    if (!object.data?.content || object.data.content.dataType !== "moveObject") {
      throw new Error(`Policy object not found: ${policyId}`);
    }

    const fields = object.data.content.fields as any;
    const now = Date.now();
    const expiryMs = Number(fields.expiry_ms);
    const budgetTotal = Number(fields.budget_total);
    const budgetRemaining = Number(fields.budget_remaining);

    const statusMap: Record<number, "active" | "paused" | "revoked" | "expired"> = {
      1: "active",
      2: "paused",
      3: "revoked",
      4: "expired",
    };

    const status = statusMap[Number(fields.status)] ?? "active";

    return {
      policyId,
      status,
      budgetTotal,
      budgetRemaining,
      budgetUsedPercent: Math.round(((budgetTotal - budgetRemaining) / budgetTotal) * 100),
      riskCeiling: Number(fields.risk_ceiling),
      currentRiskScore: 0,
      slippageGuardBps: Number(fields.slippage_guard_bps),
      maxSingleTx: Number(fields.max_single_tx),
      totalActions: Number(fields.total_actions),
      totalApproved: Number(fields.total_approved),
      totalRejected: Number(fields.total_rejected),
      policyVersion: Number(fields.policy_version),
      expiryMs,
      expiryRemainingMs: Math.max(0, expiryMs - now),
      owner: fields.owner,
      isActive: status === "active",
      isPaused: status === "paused",
      isRevoked: status === "revoked",
    };
  }

  // ── Get activity log ────────────────────────────────────
  async getActivityLog(logId: string) {
    const object = await this.client.getObject({
      id: logId,
      options: { showContent: true },
    });

    if (!object.data?.content || object.data.content.dataType !== "moveObject") {
      throw new Error(`Activity log not found: ${logId}`);
    }

    const fields = object.data.content.fields as any;

    return {
      logId,
      policyId: fields.policy_id,
      totalEntries: Number(fields.total_entries),
      approvedCount: Number(fields.approved_count),
      rejectedCount: Number(fields.rejected_count),
      pausedCount: Number(fields.paused_count),
      isSealed: Boolean(fields.is_sealed),
      entries: fields.entries ?? [],
    };
  }

  // ── Query events for a policy ───────────────────────────
  async getPolicyEvents(policyId: string) {
    const events = await this.client.queryEvents({
      query: {
        MoveModule: {
          package: this.packageId,
          module: "policy_object",
        },
      },
      limit: 50,
    });

    return events.data.filter((event: any) => {
      const parsed = event.parsedJson as any;
      return parsed?.policy_id === policyId;
    });
  }

  // ── Activate stress test ────────────────────────────────
  async activateStressTest(
    riskParamsId: string,
    injectedScore: number
  ): Promise<string> {
    if (!this.keypair) throw new Error("No keypair configured for signing");

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::risk_params::activate_stress_test`,
      arguments: [
        tx.object(riskParamsId),
        tx.pure.u64(injectedScore),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
      options: { showEffects: true },
    });

    console.log(`✓ Stress test activated — Injected score: ${injectedScore}`);
    return result.digest;
  }

  // ── Deactivate stress test ──────────────────────────────
  async deactivateStressTest(riskParamsId: string): Promise<string> {
    if (!this.keypair) throw new Error("No keypair configured for signing");

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::risk_params::deactivate_stress_test`,
      arguments: [
        tx.object(riskParamsId),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
      options: { showEffects: true },
    });

    console.log(`✓ Stress test deactivated`);
    return result.digest;
  }

  // ── Update risk score from off-chain engine ─────────────
  async updateRiskScore(
    riskParamsId: string,
    volatilityScore: number,
    oracleScore: number,
    depthScore: number
  ): Promise<RiskScoreResult> {
    if (!this.keypair) throw new Error("No keypair configured for signing");

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::risk_params::update_risk_score`,
      arguments: [
        tx.object(riskParamsId),
        tx.pure.u64(volatilityScore),
        tx.pure.u64(oracleScore),
        tx.pure.u64(depthScore),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
      options: { showEffects: true, showEvents: true },
    });

    const aggregate = Math.floor(
      (volatilityScore * 40 + oracleScore * 30 + depthScore * 30) / 100
    );

    return {
      aggregate,
      volatilityScore,
      oracleScore,
      depthScore,
      shouldPause: false,
      isStressTestActive: false,
      timestamp: Date.now(),
    };
  }

  // ── Parse error code from transaction error ─────────────
  private parseErrorCode(errorMessage: string): number {
    const match = errorMessage.match(/abort_code.*?(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  // ── Get Sui Explorer URL ────────────────────────────────
  getExplorerUrl(txDigest: string): string {
    return `https://suiexplorer.com/txblock/${txDigest}?network=${this.network}`;
  }
}
