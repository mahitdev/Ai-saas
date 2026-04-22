"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LibraryAsset = {
  id: string;
  title: string;
  content: string;
  collection: string;
  source: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

function autoTags(text: string) {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  if (/(great|love|excellent|happy|awesome)/.test(lower)) tags.push("positive");
  if (/(bad|angry|sad|issue|problem)/.test(lower)) tags.push("negative");
  if (/hola|gracias|adios/.test(lower)) tags.push("spanish");
  if (/bonjour|merci/.test(lower)) tags.push("french");
  if (/code|debug|api|function|typescript/.test(lower)) tags.push("tech");
  if (/marketing|seo|campaign|blog/.test(lower)) tags.push("marketing");
  if (tags.length === 0) tags.push("general");
  return tags;
}

export function LibraryPage() {
  const [collections, setCollections] = useState<string[]>(["General"]);
  const [newCollection, setNewCollection] = useState("");
  const [activeCollection, setActiveCollection] = useState("General");
  const [assetText, setAssetText] = useState("");
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [status, setStatus] = useState("Loading library...");
  const [versionA, setVersionA] = useState("");
  const [versionB, setVersionB] = useState("");

  const versionDiff = useMemo(() => {
    const a = versionA.split("\n");
    const b = versionB.split("\n");
    return b.filter((line) => !a.includes(line)).slice(0, 8);
  }, [versionA, versionB]);

  useEffect(() => {
    async function loadLibrary() {
      const response = await fetch("/api/library", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { collections?: string[]; assets?: LibraryAsset[]; error?: string }
        | null;

      if (!response.ok || !payload) {
        setStatus(payload?.error ?? "Failed to load library data.");
        return;
      }

      const nextCollections = payload.collections && payload.collections.length > 0 ? payload.collections : ["General"];
      setCollections(nextCollections);
      setActiveCollection((current) => (nextCollections.includes(current) ? current : nextCollections[0]));
      setAssets(payload.assets ?? []);
      setStatus("Library synced.");
    }

    void loadLibrary();
  }, []);

  async function handleCreateCollection() {
    if (!newCollection.trim()) return;

    const response = await fetch("/api/library/collections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newCollection.trim() }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { collection?: { name: string }; error?: string }
      | null;

    if (!response.ok || !payload?.collection) {
      setStatus(payload?.error ?? "Failed to create collection.");
      return;
    }

    setCollections((prev) => (prev.includes(payload.collection!.name) ? prev : [...prev, payload.collection!.name]));
    setActiveCollection(payload.collection.name);
    setNewCollection("");
    setStatus(`Collection ${payload.collection.name} ready.`);
  }

  async function handleSaveAsset() {
    if (!assetText.trim()) return;

    const response = await fetch("/api/library", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: assetText.trim(),
        title: assetText.trim().slice(0, 60),
        collection: activeCollection,
        source: "dashboard",
        tags: autoTags(assetText),
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { asset?: LibraryAsset; error?: string }
      | null;

    if (!response.ok || !payload?.asset) {
      setStatus(payload?.error ?? "Failed to save asset.");
      return;
    }

    setAssets((prev) => [payload.asset!, ...prev]);
    setAssetText("");
    setStatus(`Saved asset to ${payload.asset.collection}.`);
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Knowledge Library</CardTitle>
            <CardDescription className="text-slate-400">Collections, saved notes, prompts, and reusable outputs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {collections.map((collection) => (
                <button
                  key={collection}
                  type="button"
                  onClick={() => setActiveCollection(collection)}
                  className={`w-full rounded-md border px-2 py-2 text-left text-sm ${
                    activeCollection === collection
                      ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-100"
                      : "border-slate-700 bg-slate-900 text-slate-300"
                  }`}
                >
                  {collection}
                </button>
              ))}
            </div>
            <Input
              value={newCollection}
              onChange={(event) => setNewCollection(event.target.value)}
              placeholder="New folder name..."
              className="border-slate-700 bg-slate-900 text-slate-100"
            />
            <Button className="w-full bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void handleCreateCollection()}>
              Add Collection
            </Button>
            <p className="text-xs text-slate-400">{status}</p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
            <CardTitle>Asset Management</CardTitle>
            <CardDescription className="text-slate-400">Save generated outputs, notes, and prompts with auto-tagging.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={assetText}
                onChange={(event) => setAssetText(event.target.value)}
                placeholder="Paste AI output or prompt here..."
                className="border-slate-700 bg-slate-900 text-slate-100"
              />
              <Button className="bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25" onClick={() => void handleSaveAsset()}>
                Save Asset to {activeCollection}
              </Button>

              <div className="space-y-2">
                {assets
                  .filter((asset) => asset.collection === activeCollection)
                  .map((asset) => (
                    <div key={asset.id} className="rounded-md border border-slate-700 bg-slate-900/70 p-2">
                      <p className="text-xs text-slate-400">{new Date(asset.createdAt).toLocaleString()}</p>
                      <p className="line-clamp-3 text-sm text-slate-200">{asset.content}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {asset.tags.map((tag) => (
                          <span key={`${asset.id}-${tag}`} className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2 py-0.5 text-[11px] text-fuchsia-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle>Version Compare</CardTitle>
              <CardDescription className="text-slate-400">Compare two generated versions side-by-side.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <textarea value={versionA} onChange={(event) => setVersionA(event.target.value)} placeholder="Version A..." className="min-h-36 rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100" />
              <textarea value={versionB} onChange={(event) => setVersionB(event.target.value)} placeholder="Version B..." className="min-h-36 rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100" />
              <div className="md:col-span-2 rounded-md border border-slate-700 bg-slate-900/70 p-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Changed in Version B</p>
                <div className="mt-2 space-y-1 text-xs text-slate-300">
                  {versionDiff.length === 0 ? <p>No changed lines detected.</p> : versionDiff.map((line) => <p key={line}>+ {line}</p>)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
