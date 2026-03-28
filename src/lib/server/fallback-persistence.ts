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

const libraryAssetsByUser = new Map<string, FallbackLibraryAsset[]>();
const libraryCollectionsByUser = new Map<string, Set<string>>();
const apiKeysByUser = new Map<string, FallbackApiKey[]>();
const webhookLogsByUser = new Map<string, FallbackWebhookLog[]>();
const modelLabProfilesByUser = new Map<string, FallbackModelLabProfile>();

export function getFallbackLibrary(userId: string) {
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
