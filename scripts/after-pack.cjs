const fs = require("node:fs/promises");
const path = require("node:path");

module.exports = async function afterPack(context) {
  const projectDirectory = context.packager.projectDir;
  const resourcesDirectory = path.join(context.appOutDir, "resources");
  const dependencies = [
    [
      path.join(projectDirectory, "release", "server", "node_modules"),
      path.join(resourcesDirectory, "server", "node_modules"),
    ],
    [
      path.join(projectDirectory, "client", ".next", "standalone", "node_modules"),
      path.join(resourcesDirectory, "client", "node_modules"),
    ],
  ];

  for (const [source, destination] of dependencies) {
    await fs.cp(source, destination, { recursive: true });
  }
};
