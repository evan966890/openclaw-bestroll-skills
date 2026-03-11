#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { AGENT_SPECS, DEFAULT_FEISHU_ACCOUNTS_FILE } from "../lib/suite-manifest.mjs";
import {
  repoRootFromImport,
  parseArgs,
  resolveHomePath,
  ensureDir,
  readJsonIfExists,
  writeJson,
} from "../lib/node-helpers.mjs";

function normalizeName(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasDesiredProvision(account, spec) {
  if (!account?.appId) {
    return false;
  }
  const storedName = normalizeName(account.appName || account.botName || "");
  return storedName === normalizeName(spec.appName);
}

async function runAutomation(entryPath, payload) {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entryPath, JSON.stringify(payload)], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      const lines = `${stdout}\n${stderr}`.split("\n").map((line) => line.trim()).filter(Boolean);
      const jsonLine = [...lines].reverse().find((line) => line.startsWith("{") && line.endsWith("}"));
      if (!jsonLine) {
        reject(new Error("Feishu automation returned no JSON result."));
        return;
      }
      const result = JSON.parse(jsonLine);
      if (code !== 0 && result.ok !== true) {
        reject(new Error(result.error || `Feishu automation exited with code ${code}`));
        return;
      }
      resolve(result);
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = repoRootFromImport(import.meta.url);
  const automationEntry = path.join(repoRoot, "tools", "feishu-automation", "index.mjs");
  const permissionsPath = path.join(repoRoot, "tools", "feishu-automation", "feishu-bot-scopes.json");
  const accountsFile = path.resolve(repoRoot, args.out ? resolveHomePath(args.out) : DEFAULT_FEISHU_ACCOUNTS_FILE);
  const profileDir = path.resolve(resolveHomePath(args.profileDir || path.join(repoRoot, ".state", "feishu-browser-profile")));
  const artifactBase = path.resolve(resolveHomePath(args.artifactDir || path.join(repoRoot, ".state", "feishu-artifacts")));
  const browserExecutablePath = args.browserExecutable ? path.resolve(resolveHomePath(args.browserExecutable)) : undefined;
  const keepBrowserOpen = Boolean(args.keepBrowserOpen);
  const force = Boolean(args.force);
  const dryRun = Boolean(args.dryRun);
  const only = String(args.only || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const existing = (await readJsonIfExists(accountsFile, { accounts: {} })) ?? { accounts: {} };
  const selectedAgents = only.length ? AGENT_SPECS.filter((spec) => only.includes(spec.id)) : AGENT_SPECS;

  if (!selectedAgents.length) {
    throw new Error("No agents selected for provisioning.");
  }

  await ensureDir(path.dirname(accountsFile));
  await ensureDir(profileDir);
  await ensureDir(artifactBase);

  for (const spec of selectedAgents) {
    const currentAccount = existing.accounts?.[spec.id];
    if (currentAccount && !force && hasDesiredProvision(currentAccount, spec)) {
      console.log(`Skip ${spec.id}: already provisioned.`);
      continue;
    }

    if (currentAccount && !force) {
      console.log(
        `Reconcile ${spec.id}: stored app "${currentAccount.appName || currentAccount.botName || currentAccount.appId}" -> desired "${spec.appName}".`,
      );
    }

    const artifactDir = path.join(artifactBase, spec.id);
    const payload = {
      appName: spec.appName,
      appDescription: spec.appDescription,
      botName: spec.botName,
      aliasNames: spec.legacyAppNames ?? [],
      permissionsPath,
      artifactDir,
      profileDir,
      browserExecutablePath,
      keepBrowserOpen,
      autoPublish: true,
    };

    if (dryRun) {
      console.log(`[dry-run] ${spec.id}`);
      console.log(JSON.stringify(payload, null, 2));
      continue;
    }

    console.log(`Provisioning ${spec.id} (${spec.name}) ...`);
    const result = await runAutomation(automationEntry, payload);
    if (!result.ok) {
      throw new Error(`${spec.id} failed: ${result.error || "unknown error"}`);
    }

    existing.accounts[spec.id] = {
      accountId: spec.id,
      name: spec.name,
      botName: result.botName || spec.botName,
      appName: result.appName || spec.appName,
      appId: result.appId,
      appSecret: result.appSecret,
      artifactDir: result.artifactDir,
      consoleUrl: result.consoleUrl,
      finalScreenshot: result.finalScreenshot,
      source: result.reusedExistingApp ? "reused-existing-app" : "created",
      matchedExistingApp: result.matchedExistingApp ?? null,
      createdAt: currentAccount?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await writeJson(accountsFile, existing);
  }

  if (!dryRun) {
    console.log(`Accounts written to ${accountsFile}`);
  }
}

await main();
