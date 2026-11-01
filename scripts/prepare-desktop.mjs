import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceServer = path.join(root, "server");
const packagedServer = path.join(root, "release", "server");

await rm(packagedServer, { recursive: true, force: true });
await mkdir(path.join(packagedServer, "src", "lib"), { recursive: true });

for (const [source, destination] of [
  ["package.json", "package.json"],
  ["package-lock.json", "package-lock.json"],
  ["prisma.config.ts", "prisma.config.ts"],
  ["tsconfig.json", "tsconfig.json"],
  ["prisma", "prisma"],
  ["scripts", "scripts"],
  ["dist", "dist"],
]) {
  await cp(
    path.join(sourceServer, source),
    path.join(packagedServer, destination),
    { recursive: true },
  );
}

await cp(
  path.join(sourceServer, "src", "lib", "databaseUrl.ts"),
  path.join(packagedServer, "src", "lib", "databaseUrl.ts"),
);

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const install = spawnSync(npm, ["ci", "--omit=dev"], {
  cwd: packagedServer,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (install.status !== 0) {
  throw new Error("Could not install production server dependencies.");
}

const node = process.execPath;
const prismaCli = path.join(
  packagedServer,
  "node_modules",
  "prisma",
  "build",
  "index.js",
);
const generate = spawnSync(
  node,
  [prismaCli, "generate", "--schema", "prisma/schema"],
  {
    cwd: packagedServer,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: "file:./data/build.sqlite",
    },
  },
);
if (generate.status !== 0) {
  throw new Error("Could not generate the packaged Prisma client.");
}

console.log("Prepared production server files for the Windows installer.");
