"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  const [collections, setCollections] = useState(["Project Alpha", "Social Media Q3"]);
  const [newCollection, setNewCollection] = useState("");
  const [activeCollection, setActiveCollection] = useState("Project Alpha");
  const [assetText, setAssetText] = useState("");
  const [assets, setAssets] = useState<Array<{ id: string; collection: string; content: string; tags: string[] }>>([]);
  const [versionA, setVersionA] = useState("");
  const [versionB, setVersionB] = useState("");

  const versionDiff = useMemo(() => {
    const a = versionA.split("\n");
    const b = versionB.split("\n");
    return b.filter((line) => !a.includes(line)).slice(0, 8);
  }, [versionA, versionB]);

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Library</CardTitle>
            <CardDescription className="text-slate-400">Collections and saved prompt assets.</CardDescription>
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
            <Button
              className="w-full bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25"
              onClick={() => {
                if (!newCollection.trim()) return;
                setCollections((prev) => [...prev, newCollection.trim()]);
                setActiveCollection(newCollection.trim());
                setNewCollection("");
              }}
            >
              Add Collection
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle>Asset Management</CardTitle>
              <CardDescription className="text-slate-400">Save generated outputs with AI auto-tagging.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={assetText}
                onChange={(event) => setAssetText(event.target.value)}
                placeholder="Paste AI output or prompt here..."
                className="border-slate-700 bg-slate-900 text-slate-100"
              />
              <Button
                className="bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25"
                onClick={() => {
                  if (!assetText.trim()) return;
                  setAssets((prev) => [
                    { id: crypto.randomUUID(), collection: activeCollection, content: assetText.trim(), tags: autoTags(assetText) },
                    ...prev,
                  ]);
                  setAssetText("");
                }}
              >
                Save Asset to {activeCollection}
              </Button>

              <div className="space-y-2">
                {assets
                  .filter((asset) => asset.collection === activeCollection)
                  .map((asset) => (
                    <div key={asset.id} className="rounded-md border border-slate-700 bg-slate-900/70 p-2">
                      <p className="line-clamp-3 text-sm text-slate-200">{asset.content}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {asset.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2 py-0.5 text-[11px] text-fuchsia-200">
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

