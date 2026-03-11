#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";
import { parseArgs, resolveHomePath } from "../lib/node-helpers.mjs";

async function resolveBrowserExecutable(explicitPath) {
  const candidates = [
    explicitPath,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }
  throw new Error("No supported Chromium-based browser found.");
}

async function maybeVisible(locator) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < Math.min(count, 8); index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      return candidate;
    }
  }
  return null;
}

function nextReleaseVersion() {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(2, 14);
  return `1.0.${stamp}`;
}

async function clickFirstVisible(page, labels) {
  for (const label of labels) {
    const exact = await maybeVisible(page.getByRole("button", { name: new RegExp(label, "i") }));
    if (exact) {
      await exact.click().catch(() => {});
      return label;
    }
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.appId) {
    throw new Error("Expected --app-id");
  }

  const profileDir = path.resolve(resolveHomePath(args.profileDir || path.join(process.cwd(), ".state", "feishu-browser-profile")));
  const browserExecutable = await resolveBrowserExecutable(args.browserExecutable ? path.resolve(resolveHomePath(args.browserExecutable)) : undefined);
  const targetUrl = `https://open.feishu.cn/app/${args.appId}/version`;

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: browserExecutable,
    headless: false,
    viewport: null,
    args: ["--start-maximized", "--disable-blink-features=AutomationControlled"],
  });

  try {
    const page = context.pages()[0] ?? await context.newPage();
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);

    await clickFirstVisible(page, ["创建版本", "新建版本", "Create Version"]);
    await page.waitForTimeout(1500);

    const versionInput =
      (await maybeVisible(page.getByPlaceholder(/正式版本号/))) ??
      (await maybeVisible(page.locator('input[placeholder*="版本号"]')));
    if (versionInput) {
      await versionInput.fill(nextReleaseVersion()).catch(() => {});
    }

    const notes =
      (await maybeVisible(page.getByPlaceholder(/更新日志/))) ??
      (await maybeVisible(page.locator("textarea")));
    if (notes) {
      await notes.fill("补发布自动化版本").catch(() => {});
    }

    await clickFirstVisible(page, ["保存", "创建", "确认", "Save"]);
    await page.waitForTimeout(2000);

    await clickFirstVisible(page, ["确认发布", "提交审核并发布", "发布版本", "提交审核", "Publish"]);
    await page.waitForTimeout(2000);

    const dialog = await maybeVisible(page.locator('[role="dialog"]'));
    if (dialog) {
      const buttons = dialog.locator("button");
      const count = await buttons.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const button = buttons.nth(index);
        const label = (await button.innerText().catch(() => "")).trim();
        if (!label || /取消|Cancel/.test(label)) {
          continue;
        }
        if (/确认|发布|Publish/.test(label)) {
          await button.click().catch(() => {});
          break;
        }
      }
    }

    await Promise.race([
      page.waitForFunction(
        () => document.body.innerText.includes("已发布") || document.body.innerText.includes("当前修改均已发布"),
        { timeout: 20_000 },
      ),
      page.waitForTimeout(20_000),
    ]);

    console.log(`Published ${args.appId}`);
  } finally {
    await context.close().catch(() => {});
  }
}

await main();
