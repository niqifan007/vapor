import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();
const sourceDir = resolve(rootDir, "node_modules", "vditor", "dist");
const targetDir = resolve(rootDir, "public", "vditor", "dist");

if (!existsSync(sourceDir)) {
  throw new Error(
    `Missing Vditor dist assets at ${sourceDir}. Install dependencies first.`
  );
}

mkdirSync(resolve(rootDir, "public", "vditor"), { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true, force: true });

console.log(`Synced Vditor assets: ${sourceDir} -> ${targetDir}`);
