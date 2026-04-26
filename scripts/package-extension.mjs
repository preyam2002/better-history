import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const distDir = resolve(rootDir, "dist");
const releaseDir = resolve(rootDir, "release");

if (!existsSync(distDir)) {
	throw new Error("Build output not found. Run `npm run build` first.");
}

const pkg = JSON.parse(readFileSync(resolve(rootDir, "package.json"), "utf8"));
const zipName = `better-history-v${pkg.version}.zip`;
const zipPath = resolve(releaseDir, zipName);

rmSync(releaseDir, { recursive: true, force: true });
mkdirSync(releaseDir, { recursive: true });

execFileSync("zip", ["-r", zipPath, "."], {
	cwd: distDir,
	stdio: "inherit",
});

console.log(`Created ${zipPath}`);
