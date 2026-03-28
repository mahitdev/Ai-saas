type GovernanceLog = {
  id: string;
  userId: string;
  timestamp: string;
  direction: "input" | "output";
  model: string;
  policyFlags: string[];
  piiFound: boolean;
  rationale: string;
  aiBom: {
    model: string;
    datasets: string[];
    apis: string[];
  };
};

const logs: GovernanceLog[] = [];

function detectPolicyFlags(text: string) {
  const flags: string[] = [];
  if (/(password|api key|secret|token)/i.test(text)) flags.push("secret_exposure_risk");
  if (/(ssn|credit card|account number)/i.test(text)) flags.push("high_pii_risk");
  if (/(illegal|bypass|jailbreak|hack)/i.test(text)) flags.push("policy_violation_risk");
  return flags;
}

function piiLikely(text: string) {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b(?:\d[ -]*?){13,16}\b/i.test(text);
}

export function inspectForGovernance(params: {
  userId: string;
  direction: "input" | "output";
  text: string;
  model: string;
  routeContext: string;
}) {
  const policyFlags = detectPolicyFlags(params.text);
  const piiFound = piiLikely(params.text);
  const id = `gov_${crypto.randomUUID().slice(0, 8)}`;
  const log: GovernanceLog = {
    id,
    userId: params.userId,
    timestamp: new Date().toISOString(),
    direction: params.direction,
    model: params.model,
    policyFlags,
    piiFound,
    rationale: `${params.routeContext}: ${policyFlags.length > 0 ? "flagged controls" : "no major policy flags"}`,
    aiBom: {
      model: params.model,
      datasets: ["user-memory", "conversation-history", "uploaded-knowledge"],
      apis: ["openai-responses", "google-generative-language", "internal-policy-gateway"],
    },
  };
  logs.unshift(log);
  if (logs.length > 300) logs.pop();
  return log;
}

export function getGovernanceLogs(userId: string) {
  return logs.filter((item) => item.userId === userId).slice(0, 100);
}
