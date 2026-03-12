#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: null, body: content };
  }
  const frontmatter = Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split(":");
        return [key.trim(), rest.join(":").trim().replace(/^"|"$/g, "")];
      }),
  );
  return {
    frontmatter,
    body: content.slice(match[0].length),
  };
}

async function main() {
  const targets = process.argv.slice(2);
  if (!targets.length) {
    throw new Error("Usage: node scripts/validate-skill.mjs <skill-dir> [more-skill-dirs...]");
  }

  let hasErrors = false;
  for (const target of targets) {
    const skillDir = path.resolve(target);
    const skillMdPath = path.join(skillDir, "SKILL.md");
    if (!(await exists(skillMdPath))) {
      throw new Error(`SKILL.md not found: ${skillMdPath}`);
    }

    const content = await fs.readFile(skillMdPath, "utf8");
    const { frontmatter, body } = parseFrontmatter(content);
    const errors = [];

    if (!frontmatter) {
      errors.push("Missing frontmatter block.");
    } else {
      if (!frontmatter.name) {
        errors.push("Frontmatter missing `name`.");
      }
      if (!frontmatter.description) {
        errors.push("Frontmatter missing `description`.");
      }
      if (/TODO/i.test(frontmatter.description)) {
        errors.push("Frontmatter description still contains TODO.");
      }
    }

    if (/TODO/i.test(body)) {
      errors.push("SKILL.md body still contains TODO markers.");
    }

    const resourceRefs = [...body.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((match) => match[2]);
    for (const ref of resourceRefs) {
      if (/^https?:/i.test(ref)) {
        continue;
      }
      const targetPath = path.resolve(skillDir, ref);
      if (!(await exists(targetPath))) {
        errors.push(`Referenced resource missing: ${ref}`);
      }
    }

    if (errors.length) {
      hasErrors = true;
      for (const error of errors) {
        console.error(`${skillDir}: ${error}`);
      }
      continue;
    }

    console.log(`Skill validation passed: ${skillDir}`);
  }

  if (hasErrors) {
    process.exit(1);
  }
}

await main();
