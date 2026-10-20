const { execSync } = require("node:child_process");
const { resolve } = require("node:path");

const projectRoot = resolve(__dirname, "..");
process.chdir(projectRoot);

const pkg = require("../package.json");
const now = new Date();

// Calendar version: YYYY.M.D (for example 2026.10.20 or 2026.1.5).
// Do not zero-pad: npm rewrites "2026.01.05" to "2026.1.5", so the check below
// would never match and a second run on the same day would fail.
const version = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join(
  ".",
);

if (pkg.version !== version) {
  execSync(`npm version ${version} --no-git-tag-version`, {
    cwd: projectRoot,
    stdio: "inherit",
  });
}
