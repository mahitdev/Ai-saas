type FallbackLibraryAsset = {
  id: string;
  userId: string;
  title: string;
  content: string;
  collection: string;
  source: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type FallbackApiKey = {
  id: string;
  userId: string;
  label: string;
  key: string;
  limit: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type FallbackWebhookLog = {
  id: string;
  userId: string;
  event: string;
  statusCode: number;
  detail: string;
  createdAt: string;
};

type FallbackModelLabProfile = {
  id: string;
  userId: string;
  systemPrompt: string;
  engine: "flash" | "pro";
  styleProfileEnabled: boolean;
  knowledgeFiles: string[];
  playbooks: string[];
  updatedAt: string;
};

type FallbackRetentionInsight = {
  id: string;
  userId: string;
  churnRiskScore: number;
  weeklyHoursSaved: number;
  weeklyTasksCompleted: number;
  progressiveProfile: Record<string, string>;
  lastInterventionEmail: string | null;
  updatedAt: string;
};

type FallbackBillingProfile = {
  id: string;
  userId: string;
  plan: "basic" | "scale";
  monthlyFeeCents: number;
  proCallsIncluded: number;
  proCallsUsed: number;
  creditsRemaining: number;
  standardUnlimited: boolean;
  successFeeBps: number;
  updatedAt: string;
};

type FallbackBillingTransaction = {
  id: string;
  userId: string;
  type: string;
  credits: number;
  amountCents: number;
  note: string | null;
  createdAt: string;
};

type FallbackXaiLog = {
  id: string;
  userId: string;
  taskId: string;
  question: string;
  answer: string;
  reasoning: string;
  sources: string[];
  complianceFlags: string[];
  modelVersion: string;
  createdAt: string;
};

type FallbackPromptTemplate = {
  id: string;
  userId: string;
  title: string;
  category: string;
  prompt: string;
  uses: number;
  rewardCredits: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

const libraryAssetsByUser = new Map<string, FallbackLibraryAsset[]>();
const libraryCollectionsByUser = new Map<string, Set<string>>();
const apiKeysByUser = new Map<string, FallbackApiKey[]>();
const webhookLogsByUser = new Map<string, FallbackWebhookLog[]>();
const modelLabProfilesByUser = new Map<string, FallbackModelLabProfile>();
const retentionInsightsByUser = new Map<string, FallbackRetentionInsight>();
const billingProfilesByUser = new Map<string, FallbackBillingProfile>();
const billingTransactionsByUser = new Map<string, FallbackBillingTransaction[]>();
const xaiLogsByUser = new Map<string, FallbackXaiLog[]>();
const promptTemplates = new Map<string, FallbackPromptTemplate>();
const promptVotes = new Set<string>();
const FALLBACK_TTL_MS = 60 * 60 * 1000;
const FALLBACK_MAX_ITEMS = 100;
let lastFallbackCleanup = 0;

function maybeCleanupFallbackStores() {
  const now = Date.now();
  if (now - lastFallbackCleanup < 5 * 60 * 1000) return;
  lastFallbackCleanup = now;
  const cutoff = now - FALLBACK_TTL_MS;

  function keepRecent<T>(items: T[], dateOf: (item: T) => string | null | undefined) {
    return items
      .filter((item) => {
        const value = dateOf(item);
        return value ? new Date(value).getTime() >= cutoff : true;
      })
      .slice(0, FALLBACK_MAX_ITEMS);
  }

  for (const [userId, items] of libraryAssetsByUser) libraryAssetsByUser.set(userId, keepRecent(items, (item) => item.updatedAt));
  for (const [userId, items] of apiKeysByUser) apiKeysByUser.set(userId, keepRecent(items, (item) => item.updatedAt));
  for (const [userId, items] of webhookLogsByUser) webhookLogsByUser.set(userId, keepRecent(items, (item) => item.createdAt));
  for (const [userId, items] of billingTransactionsByUser) billingTransactionsByUser.set(userId, keepRecent(items, (item) => item.createdAt));
  for (const [userId, items] of xaiLogsByUser) xaiLogsByUser.set(userId, keepRecent(items, (item) => item.createdAt));
}

export function getFallbackLibrary(userId: string) {
  maybeCleanupFallbackStores();
  const assets = libraryAssetsByUser.get(userId) ?? [];
  const collections = libraryCollectionsByUser.get(userId) ?? new Set<string>(["General"]);
  return { assets, collections: Array.from(collections) };
}

export function ensureFallbackCollection(userId: string, name: string) {
  const collections = libraryCollectionsByUser.get(userId) ?? new Set<string>(["General"]);
  collections.add(name);
  libraryCollectionsByUser.set(userId, collections);
}

export function addFallbackAsset(asset: FallbackLibraryAsset) {
  const list = libraryAssetsByUser.get(asset.userId) ?? [];
  list.unshift(asset);
  libraryAssetsByUser.set(asset.userId, list);
  ensureFallbackCollection(asset.userId, asset.collection);
  return asset;
}

export function updateFallbackAsset(userId: string, assetId: string, updates: Partial<FallbackLibraryAsset>) {
  const assets = libraryAssetsByUser.get(userId) ?? [];
  const next = assets.map((asset) =>
    asset.id === assetId
      ? {
          ...asset,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      : asset,
  );
  libraryAssetsByUser.set(userId, next);
  const updated = next.find((asset) => asset.id === assetId) ?? null;
  if (updated?.collection) ensureFallbackCollection(userId, updated.collection);
  return updated;
}

export function deleteFallbackAsset(userId: string, assetId: string) {
  const assets = libraryAssetsByUser.get(userId) ?? [];
  const before = assets.length;
  const next = assets.filter((asset) => asset.id !== assetId);
  libraryAssetsByUser.set(userId, next);
  return before !== next.length;
}

export function deleteFallbackCollection(userId: string, key: string) {
  const collections = libraryCollectionsByUser.get(userId) ?? new Set<string>(["General"]);
  const target =
    Array.from(collections).find((item) => item.toLowerCase() === key.toLowerCase()) ?? key;
  collections.delete(target);
  collections.add("General");
  libraryCollectionsByUser.set(userId, collections);

  const assets = libraryAssetsByUser.get(userId) ?? [];
  libraryAssetsByUser.set(
    userId,
    assets.map((asset) => (asset.collection === target ? { ...asset, collection: "General" } : asset)),
  );
}

export function getFallbackApiKeys(userId: string) {
  maybeCleanupFallbackStores();
  return apiKeysByUser.get(userId) ?? [];
}

export function addFallbackApiKey(item: FallbackApiKey) {
  const list = apiKeysByUser.get(item.userId) ?? [];
  list.unshift(item);
  apiKeysByUser.set(item.userId, list);
  return item;
}

export function updateFallbackApiKey(userId: string, keyId: string, updates: Partial<FallbackApiKey>) {
  const list = apiKeysByUser.get(userId) ?? [];
  let updated: FallbackApiKey | null = null;
  apiKeysByUser.set(
    userId,
    list.map((item) => {
      if (item.id !== keyId) return item;
      updated = { ...item, ...updates, updatedAt: new Date().toISOString() };
      return updated;
    }),
  );
  return updated;
}

export function deleteFallbackApiKey(userId: string, keyId: string) {
  const list = apiKeysByUser.get(userId) ?? [];
  const before = list.length;
  const next = list.filter((item) => item.id !== keyId);
  apiKeysByUser.set(userId, next);
  return before !== next.length;
}

export function getFallbackWebhookLogs(userId: string) {
  maybeCleanupFallbackStores();
  return webhookLogsByUser.get(userId) ?? [];
}

export function addFallbackWebhookLog(log: FallbackWebhookLog) {
  const list = webhookLogsByUser.get(log.userId) ?? [];
  list.unshift(log);
  webhookLogsByUser.set(log.userId, list.slice(0, 20));
  return log;
}

export function getFallbackModelLabProfile(userId: string) {
  const existing = modelLabProfilesByUser.get(userId);
  if (existing) return existing;

  const created: FallbackModelLabProfile = {
    id: crypto.randomUUID(),
    userId,
    systemPrompt: "Always respond in a structured, practical format.",
    engine: "flash",
    styleProfileEnabled: false,
    knowledgeFiles: [],
    playbooks: [],
    updatedAt: new Date().toISOString(),
  };
  modelLabProfilesByUser.set(userId, created);
  return created;
}

export function saveFallbackModelLabProfile(userId: string, profile: Omit<FallbackModelLabProfile, "id" | "userId" | "updatedAt">) {
  const previous = getFallbackModelLabProfile(userId);
  const next: FallbackModelLabProfile = {
    ...previous,
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  modelLabProfilesByUser.set(userId, next);
  return next;
}

export function getFallbackRetentionInsight(userId: string) {
  const existing = retentionInsightsByUser.get(userId);
  if (existing) return existing;
  const created: FallbackRetentionInsight = {
    id: crypto.randomUUID(),
    userId,
    churnRiskScore: 18,
    weeklyHoursSaved: 6,
    weeklyTasksCompleted: 14,
    progressiveProfile: {},
    lastInterventionEmail: null,
    updatedAt: new Date().toISOString(),
  };
  retentionInsightsByUser.set(userId, created);
  return created;
}

export function saveFallbackRetentionInsight(
  userId: string,
  updates: Partial<Omit<FallbackRetentionInsight, "id" | "userId" | "updatedAt">>,
) {
  const current = getFallbackRetentionInsight(userId);
  const next: FallbackRetentionInsight = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  retentionInsightsByUser.set(userId, next);
  return next;
}

export function getFallbackBillingProfile(userId: string) {
  const existing = billingProfilesByUser.get(userId);
  if (existing) return existing;
  const created: FallbackBillingProfile = {
    id: crypto.randomUUID(),
    userId,
    plan: "basic",
    monthlyFeeCents: 2000,
    proCallsIncluded: 100,
    proCallsUsed: 0,
    creditsRemaining: 100,
    standardUnlimited: false,
    successFeeBps: 200,
    updatedAt: new Date().toISOString(),
  };
  billingProfilesByUser.set(userId, created);
  return created;
}

export function saveFallbackBillingProfile(
  userId: string,
  updates: Partial<Omit<FallbackBillingProfile, "id" | "userId" | "updatedAt">>,
) {
  const current = getFallbackBillingProfile(userId);
  const next: FallbackBillingProfile = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  billingProfilesByUser.set(userId, next);
  return next;
}

export function addFallbackBillingTransaction(tx: FallbackBillingTransaction) {
  const list = billingTransactionsByUser.get(tx.userId) ?? [];
  list.unshift(tx);
  billingTransactionsByUser.set(tx.userId, list.slice(0, 50));
  return tx;
}

export function getFallbackBillingTransactions(userId: string) {
  return billingTransactionsByUser.get(userId) ?? [];
}

export function addFallbackXaiLog(log: FallbackXaiLog) {
  const list = xaiLogsByUser.get(log.userId) ?? [];
  list.unshift(log);
  xaiLogsByUser.set(log.userId, list.slice(0, 50));
  return log;
}

export function getFallbackXaiLogs(userId: string) {
  return xaiLogsByUser.get(userId) ?? [];
}

export function addFallbackPromptTemplate(template: FallbackPromptTemplate) {
  promptTemplates.set(template.id, template);
  return template;
}

export function listFallbackPromptTemplates() {
  return Array.from(promptTemplates.values()).sort((a, b) => b.uses - a.uses);
}

export function voteFallbackPromptTemplate(userId: string, templateId: string) {
  const key = `${userId}:${templateId}`;
  if (promptVotes.has(key)) return null;
  promptVotes.add(key);
  const template = promptTemplates.get(templateId);
  if (!template) return null;
  const updated = { ...template, uses: template.uses + 1, rewardCredits: template.rewardCredits + 1, updatedAt: new Date().toISOString() };
  promptTemplates.set(templateId, updated);
  return updated;
}
