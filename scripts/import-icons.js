#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Import icons from npm icon packages into src/svg/.
//
// Usage:
//   npm run import <source> <icon-name> [<icon-name>...]
//   npm run import bootstrap-icons file-arrow-down
//   npm run import bootstrap-icons file-arrow-down file-arrow-up --force
//
// Sources are registered below. Each entry points at the directory inside the
// npm package that holds the individual SVG files. Add a new entry here when
// adopting another icon package (e.g. tabler-icons, phosphor-icons).
// ---------------------------------------------------------------------------

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Registry of importable icon sources (npm package -> icons directory).
const SOURCES = {
  "bootstrap-icons": { package: "bootstrap-icons", dir: "icons" },
};

const TARGET_DIR = path.join(ROOT, "src", "svg");

function usage() {
  console.log(
    [
      "Usage: npm run import <source> <icon-name> [<icon-name>...]",
      "",
      "Available sources:",
      ...Object.keys(SOURCES).map((name) => `  ${name}`),
      "",
      "Examples:",
      "  npm run import bootstrap-icons file-arrow-down",
      "  npm run import bootstrap-icons file-arrow-down --force",
    ].join("\n"),
  );
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const positional = args.filter((a) => a !== "--force");

  if (positional.length < 2) {
    usage();
    process.exit(1);
  }

  const [sourceName, ...iconNames] = positional;
  const source = SOURCES[sourceName];

  if (!source) {
    console.error(`Unknown source '${sourceName}'.`);
    usage();
    process.exit(1);
  }

  const sourceDir = path.join(ROOT, "node_modules", source.package, source.dir);
  if (!(await fs.pathExists(sourceDir))) {
    console.error(
      `Source directory not found: ${path.relative(ROOT, sourceDir)}. ` +
        `Is '${source.package}' installed?`,
    );
    process.exit(1);
  }

  await fs.ensureDir(TARGET_DIR);

  let imported = 0;
  let skipped = 0;

  for (const name of iconNames) {
    const srcFile = path.join(sourceDir, `${name}.svg`);
    const destFile = path.join(TARGET_DIR, `${name}.svg`);

    if (!(await fs.pathExists(srcFile))) {
      console.error(`  ✗ ${name} — not found in ${sourceName} (${path.relative(ROOT, srcFile)})`);
      continue;
    }

    if ((await fs.pathExists(destFile)) && !force) {
      console.warn(`  ! ${name} — already exists in src/svg/, skipping (use --force to overwrite)`);
      skipped++;
      continue;
    }

    await fs.copy(srcFile, destFile);
    console.log(`  ✓ ${name} — copied to src/svg/${name}.svg`);
    imported++;
  }

  console.log(
    `\nImported ${imported} icon(s)${skipped ? `, skipped ${skipped}` : ""}. Run 'npm run build' to regenerate dist/.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});