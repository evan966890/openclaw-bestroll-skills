#!/usr/bin/env node

import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { repoRootFromImport } from "../lib/node-helpers.mjs";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
};

const repoRoot = repoRootFromImport(import.meta.url);
const defaultEntry = path.join(repoRoot, "apps", "questionnaire", "index.html");
const port = Number(process.env.PORT || 4173);

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
    const requested = urlPath === "/" ? defaultEntry : path.join(repoRoot, urlPath);
    const safePath = requested.startsWith(repoRoot) ? requested : defaultEntry;
    const finalPath = path.extname(safePath) ? safePath : defaultEntry;
    const content = await fs.readFile(finalPath);
    const ext = path.extname(finalPath);
    res.writeHead(200, {
      "content-type": MIME_TYPES[ext] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(content);
  } catch (error) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Not found: ${error instanceof Error ? error.message : String(error)}`);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Questionnaire: http://127.0.0.1:${port}/`);
});
