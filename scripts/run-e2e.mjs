import { spawn } from "node:child_process";
import path from "node:path";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const isWindows = process.platform === "win32";

function runNodeScript(script, args, options = {}) {
  return spawn(process.execPath, [script, ...args], {
    stdio: "inherit",
    shell: false,
    ...options,
  });
}

async function waitForServer(url, timeoutMs = 120_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch {
      // Server is not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function killProcessTree(child) {
  if (!child?.pid) return Promise.resolve();

  return new Promise((resolve) => {
    if (isWindows) {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        shell: false,
      }).once("exit", () => resolve());
      return;
    }

    child.kill("SIGTERM");
    resolve();
  });
}

let server;
let exitCode = 0;

try {
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    server = runNodeScript(path.join("node_modules", "next", "dist", "bin", "next"), ["dev", "--hostname", "127.0.0.1"], {
      env: { ...process.env, PORT: "3000" },
    });
    await waitForServer(baseUrl);
  }

  const playwright = runNodeScript(path.join("node_modules", "@playwright", "test", "cli.js"), ["test"]);
  exitCode = await new Promise((resolve) => {
    playwright.once("exit", (code) => resolve(code ?? 1));
  });
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  await killProcessTree(server);
}

process.exit(exitCode);
