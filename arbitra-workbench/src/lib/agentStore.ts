export interface DeployedAgent {
  policyId: string;
  capId: string;
  txDigest: string;
  agentName: string;
  agentType: string;
  agentIcon: string;
  strategy: string;
  budget: number;
  token: string;
  tradingPair: string;
  scope: string;
  expiry: string;
  riskCeiling: number;
  slippageGuardBps: number;
  maxSingleTx: number;
  connectionType: string;
  endpointUrl: string;
  template?: string;
  deployedAt: number;
  network: string;
  owner: string;
}

export function saveAgent(agent: DeployedAgent) {
  if (typeof window === "undefined") return;
  const existing = getAgents();
  existing.push(agent);
  localStorage.setItem("arbitra_agents", JSON.stringify(existing));
}

export function getAgents(): DeployedAgent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("arbitra_agents");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAgent(policyId: string): DeployedAgent | null {
  return getAgents().find(a => a.policyId === policyId) ?? null;
}

export function removeAgent(policyId: string) {
  if (typeof window === "undefined") return;
  const filtered = getAgents().filter(a => a.policyId !== policyId);
  localStorage.setItem("arbitra_agents", JSON.stringify(filtered));
}
