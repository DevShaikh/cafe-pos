const { writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { existsSync, readFileSync } = require("node:fs");

const projectRoot = resolve(__dirname, "..");
process.chdir(projectRoot);

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const now = new Date();
const version = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join(
  ".",
);

const projects = [
  { name: "root", path: projectRoot },
  { name: "client", path: resolve(projectRoot, "client") },
  { name: "server", path: resolve(projectRoot, "server") },
];

for (const project of projects) {
  const packagePath = resolve(project.path, "package.json");

  if (!existsSync(packagePath)) {
    console.warn(`Skipping ${project.name}: package.json not found.`);
    continue;
  }

  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

  pkg.version = version;

  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

  console.log(`${project.name}: updated to ${version}`);
}
