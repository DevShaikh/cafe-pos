const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

const projectRoot = resolve(__dirname, "..");
process.chdir(projectRoot);

const now = new Date();
const version = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join(
  ".",
);

const projects = [
  { name: "root", path: projectRoot },
  { name: "client", path: resolve(projectRoot, "client") },
  { name: "server", path: resolve(projectRoot, "server") },
];

function updateJson(filePath: string, update: (json: any) => void) {
  const json = JSON.parse(readFileSync(filePath, "utf8"));
  update(json);
  writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
}

for (const project of projects) {
  const packagePath = resolve(project.path, "package.json");

  if (!existsSync(packagePath)) {
    console.warn(`Skipping ${project.name}: package.json not found.`);
    continue;
  }

  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

  if (pkg.version !== version) {
    pkg.version = version;
    writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  }

  console.log(`${project.name}: ${version}`);

  const lockPath = resolve(project.path, "package-lock.json");

  if (!existsSync(lockPath)) {
    continue;
  }

  updateJson(
    lockPath,
    (lock: {
      version: string;
      packages: { [x: string]: { version: string } };
    }) => {
      lock.version = version;

      if (lock.packages?.[""]) {
        lock.packages[""].version = version;
      }
    },
  );
}
