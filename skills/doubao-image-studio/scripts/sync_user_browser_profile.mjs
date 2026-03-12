#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import { spawnSync } from "node:child_process";

const MAC_BROWSER_ROOTS = {
  chrome: {
    root: "~/Library/Application Support/Google/Chrome",
    processHints: ["Google Chrome.app/Contents/MacOS/Google Chrome"],
  },
  edge: {
    root: "~/Library/Application Support/Microsoft Edge",
    processHints: ["Microsoft Edge.app/Contents/MacOS/Microsoft Edge"],
  },
  brave: {
    root: "~/Library/Application Support/BraveSoftware/Brave-Browser",
    processHints: ["Brave Browser.app/Contents/MacOS/Brave Browser"],
  },
  chromium: {
    root: "~/Library/Application Support/Chromium",
    processHints: ["Chromium.app/Contents/MacOS/Chromium"],
  },
};

const EXCLUDES = new Set([
  "Cache",
  "Code Cache",
  "GPUCache",
  "GrShaderCache",
  "GraphiteDawnCache",
  "DawnGraphiteCache",
  "ShaderCache",
  "Crashpad",
  "component_crx_cache",
  "extensions_crx_cache",
]);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function resolveHomePath(input) {
  if (!input) return input;
  if (input === "~") return os.homedir();
  if (input.startsWith("~/")) return path.join(os.homedir(), input.slice(2));
  return input;
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function processList() {
  const result = spawnSync("ps", ["-ax", "-o", "command="], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.split("\n").filter(Boolean) : [];
}

function hasMatchingProcess(hints) {
  const commands = processList();
  return commands.some((command) => hints.some((hint) => command.includes(hint)));
}

async function copyDirFiltered(sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDES.has(entry.name)) {
      continue;
    }
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirFiltered(sourcePath, targetPath);
      continue;
    }
    if (entry.isFile()) {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const browserKey = String(args["source-browser"] || "chrome").toLowerCase();
  const sourceProfile = String(args["source-profile"] || "Default");
  const targetProfile = String(args["target-profile"] || "openclaw");
  const openclawHome = path.resolve(resolveHomePath(args["openclaw-home"] || "~/.openclaw"));
  const browserMeta = MAC_BROWSER_ROOTS[browserKey];

  if (!browserMeta) {
    fail(`Unsupported source browser: ${browserKey}`);
  }

  const sourceRoot = path.resolve(resolveHomePath(args["source-root"] || browserMeta.root));
  const sourceProfileDir = path.join(sourceRoot, sourceProfile);
  const sourceLocalState = path.join(sourceRoot, "Local State");
  const targetUserDataDir = path.join(openclawHome, "browser", targetProfile, "user-data");
  const targetProfileDir = path.join(targetUserDataDir, "Default");

  try {
    await fs.access(sourceProfileDir);
  } catch {
    fail(`Source browser profile not found: ${sourceProfileDir}`);
  }

  if (!args["skip-source-process-check"] && hasMatchingProcess(browserMeta.processHints)) {
    fail(`Source browser is still running. Close it first, then rerun. Browser: ${browserKey}`);
  }

  const openclawProcessHints = [path.join(openclawHome, "browser", targetProfile, "user-data")];
  if (!args["skip-target-process-check"] && hasMatchingProcess(openclawProcessHints)) {
    fail(`OpenClaw browser profile "${targetProfile}" is still running. Stop it first, then rerun.`);
  }

  await fs.rm(targetUserDataDir, { recursive: true, force: true });
  await fs.mkdir(targetUserDataDir, { recursive: true });

  try {
    await fs.copyFile(sourceLocalState, path.join(targetUserDataDir, "Local State"));
  } catch {
    log("skip: source Local State not found");
  }

  await copyDirFiltered(sourceProfileDir, targetProfileDir);

  log(`Source: ${sourceProfileDir}`);
  log(`Target: ${targetProfileDir}`);
  log(`Done. Next step: openclaw browser start --browser-profile ${targetProfile}`);
}

await main();
