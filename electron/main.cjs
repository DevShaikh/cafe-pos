const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
} = require("electron");
const { spawn, spawnSync } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const path = require("node:path");

Menu.setApplicationMenu(null);
app.setAppUserModelId("com.devshaikh.cafe-pos");

const API_PORT = 3000;
const CLIENT_PORT = 3001;
const MIGRATIONS_REQUIRED =
  "Cafe POS found an existing database without a verified migration baseline. " +
  "It was not changed. Restore a verified backup or contact support before upgrading.";

let apiProcess;
let clientProcess;
let mainWindow;
let isQuitting = false;
let isRestartingServices = false;
let allowQuit = false;
let quitCleanupStarted = false;
let packagedPaths;

function appendLog(source, data) {
  const logPath = path.join(app.getPath("userData"), "logs", "desktop.log");
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(
    logPath,
    `[${new Date().toISOString()}] [${source}] ${data.toString()}`,
  );
}

function childEnvironment(userDataPath, jwtSecret, port = API_PORT) {
  const environment = {
    ...process.env,
    NODE_ENV: "production",
    JWT_SECRET: jwtSecret,
    DATABASE_URL: `file:${path.join(userDataPath, "cafe-pos.db").replace(/\\/g, "/")}`,
    PRODUCT_IMAGE_DIRECTORY: path.join(userDataPath, "product-images"),
    PORT: String(port),
    CLIENT_ORIGIN: `http://127.0.0.1:${CLIENT_PORT}`,
    SERVER_URL: `http://127.0.0.1:${API_PORT}`,
    HOSTNAME: "127.0.0.1",
    CAFE_POS_DESKTOP: "1",
  };
  return Object.fromEntries(
    Object.entries(environment).filter(([, value]) => value !== undefined),
  );
}

function loadOrCreateJwtSecret(userDataPath) {
  const secretPath = path.join(userDataPath, "jwt-secret");
  try {
    return fs.readFileSync(secretPath, "utf8").trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const secret = randomBytes(48).toString("base64url");
  fs.writeFileSync(secretPath, `${secret}\n`, { flag: "wx", mode: 0o600 });
  return secret;
}

function runDataUtility(nodePath, serverDirectory, operation, ...args) {
  const utility = spawn(
    nodePath,
    [path.join(serverDirectory, "scripts", "desktop-data.cjs"), operation, ...args],
    {
      cwd: serverDirectory,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let stdout = "";
  let stderr = "";
  utility.stdout.setEncoding("utf8");
  utility.stderr.setEncoding("utf8");
  utility.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  utility.stderr.on("data", (chunk) => {
    stderr += chunk;
    appendLog("DATA", chunk);
  });

  return new Promise((resolve, reject) => {
    utility.on("error", reject);
    utility.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Database utility exited with code ${code}.`));
        return;
      }
      resolve(stdout);
    });
  });
}

async function inspectDatabase(nodePath, serverDirectory, databasePath) {
  const output = await runDataUtility(
    nodePath,
    serverDirectory,
    "inspect",
    databasePath,
  );
  return JSON.parse(output);
}

async function assertSafeMigrationState(
  nodePath,
  serverDirectory,
  databasePath,
) {
  const state = await inspectDatabase(nodePath, serverDirectory, databasePath);
  if (!state.exists || state.tables.length === 0) return state;
  if (!state.coreMigrationApplied) throw new Error(MIGRATIONS_REQUIRED);
  if (state.integrity !== "ok") {
    throw new Error(
      "Cafe POS found a damaged database and did not change it. Restore a verified backup before continuing.",
    );
  }
  return state;
}

function runDatabaseMigrations(nodePath, serverDirectory, environment) {
  const migration = spawnSync(
    nodePath,
    [
      path.join(serverDirectory, "node_modules", "prisma", "build", "index.js"),
      "migrate",
      "deploy",
      "--schema",
      "prisma/schema",
    ],
    {
      cwd: serverDirectory,
      env: environment,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      timeout: 120_000,
    },
  );

  if (migration.stdout) appendLog("MIGRATE", migration.stdout);
  if (migration.stderr) appendLog("MIGRATE", migration.stderr);
  if (migration.error || migration.status !== 0) {
    throw new Error(
      "Cafe POS could not safely prepare its database. Check the desktop log or restore a verified backup.",
    );
  }
}

function startService(nodePath, entryPoint, cwd, environment, name) {
  const child = spawn(nodePath, [entryPoint], {
    cwd,
    env: environment,
    windowsHide: true,
    stdio: [name === "API" ? "pipe" : "ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (data) => appendLog(name, data));
  child.stderr.on("data", (data) => appendLog(name, data));
  child.on("error", (error) => appendLog(name, error.stack ?? error.message));
  child.on("exit", (code, signal) => {
    appendLog(name, `Exited with code ${code ?? "none"} and signal ${signal ?? "none"}.\n`);
    if (!isQuitting && !isRestartingServices) {
      void dialog
        .showMessageBox({
          type: "error",
          title: "Cafe POS service stopped",
          message:
            "A local Cafe POS service stopped unexpectedly. The app will close to prevent incomplete operations.",
          detail: "Check the desktop log before starting Cafe POS again.",
        })
        .then(() => app.quit());
    }
  });
  return child;
}

async function waitForService(url, child, name) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`${name} stopped before it became ready.`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The service may need a moment to bind its localhost port.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`${name} did not become ready within 30 seconds.`);
}

async function startPackagedServices() {
  const resources = process.resourcesPath;
  const nodePath = path.join(resources, "runtime", "node.exe");
  const serverDirectory = path.join(resources, "server");
  const clientDirectory = path.join(resources, "client");
  const userDataPath = app.getPath("userData");
  const databasePath = path.join(userDataPath, "cafe-pos.db");
  fs.mkdirSync(userDataPath, { recursive: true });
  packagedPaths = {
    nodePath,
    serverDirectory,
    clientDirectory,
    userDataPath,
    databasePath,
  };

  const jwtSecret = loadOrCreateJwtSecret(userDataPath);
  const apiEnvironment = childEnvironment(userDataPath, jwtSecret, API_PORT);
  const clientEnvironment = childEnvironment(
    userDataPath,
    jwtSecret,
    CLIENT_PORT,
  );

  const databaseState = await assertSafeMigrationState(
    nodePath,
    serverDirectory,
    databasePath,
  );
  let migrationBackup;
  if (databaseState.exists && databaseState.tables.length > 0) {
    const applied = new Set(databaseState.appliedMigrations);
    const migrationDirectory = path.join(serverDirectory, "prisma", "migrations");
    const pending = fs
      .readdirSync(migrationDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !applied.has(entry.name));
    if (pending.length > 0) {
      migrationBackup = await createBackupAt(
        nodePath,
        serverDirectory,
        userDataPath,
        databasePath,
        "pre-migration",
      );
    }
  }
  try {
    runDatabaseMigrations(nodePath, serverDirectory, apiEnvironment);
  } catch (error) {
    if (migrationBackup) {
      await installBackup(migrationBackup, userDataPath);
      throw new Error(
        `${error.message} The previous database was restored from ${migrationBackup}.`,
      );
    }
    throw error;
  }

  await startServices(apiEnvironment, clientEnvironment);
}

async function startServices(apiEnvironment, clientEnvironment) {
  const { nodePath, serverDirectory, clientDirectory } = packagedPaths;
  apiProcess = startService(
    nodePath,
    path.join(serverDirectory, "dist", "server.js"),
    serverDirectory,
    apiEnvironment,
    "API",
  );
  await waitForService(
    `http://127.0.0.1:${API_PORT}/api/health`,
    apiProcess,
    "The API",
  );

  clientProcess = startService(
    nodePath,
    path.join(clientDirectory, "server.js"),
    clientDirectory,
    clientEnvironment,
    "CLIENT",
  );
  await waitForService(
    `http://127.0.0.1:${CLIENT_PORT}/`,
    clientProcess,
    "The user interface",
  );
}

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function createBackupAt(
  nodePath,
  serverDirectory,
  userDataPath,
  databasePath,
  prefix,
  parentDirectory = path.join(userDataPath, "backups"),
) {
  const backupDirectory = path.join(parentDirectory, `${prefix}-${getTimestamp()}`);
  const imageDirectory = path.join(userDataPath, "product-images");
  await fsPromises.mkdir(backupDirectory, { recursive: false });
  try {
    await runDataUtility(
      nodePath,
      serverDirectory,
      "backup",
      databasePath,
      path.join(backupDirectory, "cafe-pos.db"),
    );
    if (fs.existsSync(imageDirectory)) {
      await fsPromises.cp(imageDirectory, path.join(backupDirectory, "product-images"), {
        recursive: true,
        errorOnExist: true,
      });
    } else {
      await fsPromises.mkdir(path.join(backupDirectory, "product-images"));
    }
    await fsPromises.writeFile(
      path.join(backupDirectory, "backup.json"),
      JSON.stringify(
        {
          formatVersion: 1,
          appVersion: app.getVersion(),
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );
    return backupDirectory;
  } catch (error) {
    await fsPromises.rm(backupDirectory, { recursive: true, force: true });
    throw error;
  }
}

async function validateBackupDirectory(nodePath, serverDirectory, directory) {
  let manifest;
  try {
    manifest = JSON.parse(
      await fsPromises.readFile(path.join(directory, "backup.json"), "utf8"),
    );
  } catch {
    throw new Error(
      "This folder is not a Cafe POS backup. Choose a folder containing a valid backup.json file.",
    );
  }
  if (!manifest || manifest.formatVersion !== 1) {
    throw new Error("This Cafe POS backup format is not supported.");
  }

  const databasePath = path.join(directory, "cafe-pos.db");
  const imageDirectory = path.join(directory, "product-images");
  if (
    !fs.existsSync(databasePath) ||
    !fs.statSync(databasePath).isFile() ||
    !fs.existsSync(imageDirectory) ||
    !fs.statSync(imageDirectory).isDirectory()
  ) {
    throw new Error("The backup is incomplete. Its database or photos are missing.");
  }

  const state = await inspectDatabase(nodePath, serverDirectory, databasePath);
  if (state.integrity !== "ok" || !state.coreMigrationApplied) {
    throw new Error("The backup database failed its integrity or migration check.");
  }
  return { databasePath, imageDirectory };
}

async function installBackup(sourceDirectory, userDataPath) {
  const databasePath = path.join(userDataPath, "cafe-pos.db");
  const imageDirectory = path.join(userDataPath, "product-images");
  const stagedDatabasePath = path.join(userDataPath, `.restore-${getTimestamp()}.db`);
  await fsPromises.copyFile(
    path.join(sourceDirectory, "cafe-pos.db"),
    stagedDatabasePath,
  );
  await fsPromises.rm(databasePath, { force: true });
  await fsPromises.rm(`${databasePath}-wal`, { force: true });
  await fsPromises.rm(`${databasePath}-shm`, { force: true });
  await fsPromises.rename(stagedDatabasePath, databasePath);
  await fsPromises.rm(imageDirectory, { recursive: true, force: true });
  await fsPromises.cp(
    path.join(sourceDirectory, "product-images"),
    imageDirectory,
    { recursive: true },
  );
}

function getDesktopEnvironments() {
  if (!packagedPaths) throw new Error("Desktop services are not configured.");
  const jwtSecret = loadOrCreateJwtSecret(packagedPaths.userDataPath);
  return {
    api: childEnvironment(packagedPaths.userDataPath, jwtSecret, API_PORT),
    client: childEnvironment(packagedPaths.userDataPath, jwtSecret, CLIENT_PORT),
  };
}

async function stopService(child) {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  if (child.stdin?.writable) child.stdin.end("shutdown\n");
  else child.kill();

  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(resolve, 10_000);
  });
  await Promise.race([exited, timeout]);
  clearTimeout(timeoutId);
  if (child.exitCode === null) {
    child.kill();
    let forceTimeoutId;
    await Promise.race([
      exited,
      new Promise((resolve) => {
        forceTimeoutId = setTimeout(resolve, 2_000);
      }),
    ]);
    clearTimeout(forceTimeoutId);
  }
}

function requireTrustedPackagedSender(event) {
  if (
    !app.isPackaged ||
    !mainWindow ||
    event.sender !== mainWindow.webContents
  ) {
    throw new Error("This desktop operation is unavailable in this window.");
  }
}

async function createManualBackup(event) {
  requireTrustedPackagedSender(event);
  const selection = await dialog.showOpenDialog(mainWindow, {
    title: "Choose where to save the Cafe POS backup",
    properties: ["openDirectory", "createDirectory"],
  });
  if (selection.canceled || selection.filePaths.length === 0) {
    return { canceled: true };
  }
  if (!packagedPaths) throw new Error("Desktop services are not configured.");

  const parentDirectory = selection.filePaths[0];
  const imagesPath = path.resolve(packagedPaths.userDataPath, "product-images");
  const relative = path.relative(imagesPath, path.resolve(parentDirectory));
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new Error("Choose a backup location outside the product photos folder.");
  }

  const backupDirectory = await createBackupAt(
    packagedPaths.nodePath,
    packagedPaths.serverDirectory,
    packagedPaths.userDataPath,
    packagedPaths.databasePath,
    "Cafe-POS-Backup",
    parentDirectory,
  );
  return { canceled: false, path: backupDirectory };
}

async function restoreManualBackup(event) {
  requireTrustedPackagedSender(event);
  const selection = await dialog.showOpenDialog(mainWindow, {
    title: "Choose a Cafe POS backup folder",
    properties: ["openDirectory"],
  });
  if (selection.canceled || selection.filePaths.length === 0) {
    return { canceled: true };
  }
  if (!packagedPaths) throw new Error("Desktop services are not configured.");

  const sourceDirectory = selection.filePaths[0];
  await validateBackupDirectory(
    packagedPaths.nodePath,
    packagedPaths.serverDirectory,
    sourceDirectory,
  );
  const confirmation = await dialog.showMessageBox(mainWindow, {
    type: "warning",
    title: "Restore Cafe POS backup?",
    message: "Restoring replaces the current orders, settings, and product photos.",
    detail:
      "A safety backup of the current data will be created before the restore.",
    buttons: ["Cancel", "Restore backup"],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
  });
  if (confirmation.response !== 1) return { canceled: true };

  const beforeRestore = await createBackupAt(
    packagedPaths.nodePath,
    packagedPaths.serverDirectory,
    packagedPaths.userDataPath,
    packagedPaths.databasePath,
    "pre-restore",
  );

  // Log pre-restore backup location for manual recovery if needed
  appendLog("RESTORE", `Pre-restore safety backup created at: ${beforeRestore}`);

  const stagingDirectory = path.join(
    packagedPaths.userDataPath,
    `.restore-stage-${getTimestamp()}`,
  );

  // Validate source files exist and are readable before attempting restore
  try {
    const dbStat = fs.statSync(path.join(sourceDirectory, "cafe-pos.db"));
    if (!dbStat.isFile()) {
      throw new Error("Source database file not found or is not a regular file");
    }
    appendLog("RESTORE", `Source database file verified: ${sourceDirectory}/cafe-pos.db (${dbStat.size} bytes)`);
  } catch (error) {
    appendLog("RESTORE", `Failed to validate source database file: ${error.message}`);
    throw new Error(`Cannot proceed with restore: Source database is missing or corrupted. Please try from a different backup.`);
  }

  try {
    await fsPromises.mkdir(stagingDirectory);

    // Copy database with verification
    const dbDest = path.join(stagingDirectory, "cafe-pos.db");
    await fsPromises.copyFile(
      path.join(sourceDirectory, "cafe-pos.db"),
      dbDest,
    );
    appendLog("RESTORE", `Database copied to staging directory`);

    // Copy product images if they exist in source
    const imagesSrc = path.join(sourceDirectory, "product-images");
    try {
      await fsPromises.stat(imagesSrc);
      await fsPromises.cp(
        imagesSrc,
        path.join(stagingDirectory, "product-images"),
        { recursive: true },
      );
      appendLog("RESTORE", `Product images copied from: ${imagesSrc}`);
    } catch (statError) {
      // product-images may not exist in all backups - that's okay
      appendLog("RESTORE", "Product-images folder not found in source backup; copying optional directory skipped");
    }
  } catch (error) {
    // Clean up staging directory on failure
    await fsPromises.rm(stagingDirectory, { recursive: true, force: true });
    appendLog("RESTORE-ERROR", `Restore preparation failed: ${error.message}`);
    throw error;
  }
  const environments = getDesktopEnvironments();

  // Track restore operation state for better error context
  const restoreContext = {
    sourceDirectory: selection.filePaths[0],
    beforeRestoreBackup: beforeRestore,
    stagingDirectory: stagingDirectory,
    failedAt: null,
  };

  isRestartingServices = true;

  // Log restore start for troubleshooting
  appendLog("RESTORE", `Manual restore initiated from ${restoreContext.sourceDirectory}`);
  appendLog("RESTORE", `Target database path: ${packagedPaths.databasePath}`);

  try {
    // Stop services with logging
    appendLog("RESTORE", "Stopping application services before restore");
    await stopService(clientProcess);
    await stopService(apiProcess);
    clientProcess = undefined;
    apiProcess = undefined;
    appendLog("RESTORE", "Services stopped successfully");

    // Install the staged backup with detailed logging
    appendLog("RESTORE", `Installing backup from staging directory: ${stagingDirectory}`);
    await installBackup(stagingDirectory, packagedPaths.userDataPath);
    appendLog("RESTORE", "Backup installed to target database path");

    // Validate migration state after restore
    appendLog("RESTORE", "Validating database integrity and migration state after restore");
    const migrationState = await assertSafeMigrationState(
      packagedPaths.nodePath,
      packagedPaths.serverDirectory,
      packagedPaths.databasePath,
    );

    // Log migration validation results for debugging
    appendLog("RESTORE", `Migration guard check passed: coreMigrationApplied=${migrationState.coreMigrationApplied}`);

    // Start services after restore
    await startServices(environments.api, environments.client);
    appendLog("RESTORE", "Services restarted successfully");

    mainWindow.webContents.reload();
    appendLog("RESTORE", "Application window reloaded");

    return { canceled: false, path: sourceDirectory };
  } catch (error) {
    // Failed at restore stage
    restoreContext.failedAt = 'restore';
    restoreContext.restoreError = error.message;
    appendLog("RESTORE-ERROR", `Restore failed at installBackup/migration stage: ${error.message}`);

    try {
      // Attempt rollback from pre-restore safety backup
      appendLog("RESTORE", `Attempting automatic recovery from safety backup: ${beforeRestore}`);

      await stopService(clientProcess);
      await stopService(apiProcess);
      clientProcess = undefined;
      apiProcess = undefined;

      await installBackup(beforeRestore, packagedPaths.userDataPath);

      // Validate the recovered backup before attempting migrations
      const recoveryState = await inspectDatabase(
        packagedPaths.nodePath,
        packagedPaths.serverDirectory,
        packagedPaths.databasePath,
      );

      if (!recoveryState.coreMigrationApplied) {
        throw new Error(
          `Safety backup is not migrated. Cannot recover from ${beforeRestore}.` +
          `Please restore from a verified backup or contact support.`
        );
      }

      if (recoveryState.integrity !== "ok") {
        throw new Error(
          `Recovered database integrity check failed: ${recoveryState.integrity}` +
          `. Cannot proceed with automatic recovery.`
        );
      }

      appendLog("RESTORE", "Safety backup validated successfully");

      // Run migrations on recovered data
      runDatabaseMigrations(
        packagedPaths.nodePath,
        packagedPaths.serverDirectory,
        environments.api,
      );

      await startServices(environments.api, environments.client);
      mainWindow.webContents.reload();

      appendLog("RESTORE", "Recovery successful - services restarted");

      // Success message for debugging
      console.log(`Restore recovery successful from ${beforeRestore}`);

    } catch (rollbackError) {
      restoreContext.failedAt = 'rollback';
      restoreContext.rollbackError = rollbackError.message;

      appendLog("RESTORE-ERROR", `Recovery from safety backup failed: ${rollbackError.message}`);

      // Both restore and recovery failed - provide detailed error to user
      throw new Error(
        `Restore operation failed and automatic recovery also failed.\n\n` +
        `Original error: ${error.message}\n\n` +
        `Recovery error: ${rollbackError.message}\n\n` +
        `The safety backup at ${beforeRestore} was used for recovery but it is corrupted or invalid.\n\n` +
        `Do not start a new sale. Contact support and provide the safety backup path: ${beforeRestore}`
      );
    } finally {
      // Always clean up staging directory regardless of outcome
      try {
        await fsPromises.rm(stagingDirectory, { recursive: true, force: true });
        appendLog("RESTORE", "Cleaned up staging directory");
      } catch (cleanupError) {
        // Ignore cleanup failures after restore failure
        appendLog("RESTORE-ERROR", `Failed to clean staging directory: ${cleanupError.message}`);
      }

      isRestartingServices = false;
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: "Cafe POS",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const applicationUrl = app.isPackaged
    ? `http://127.0.0.1:${CLIENT_PORT}`
    : "http://localhost:3001";
  void mainWindow.loadURL(applicationUrl).catch((error) => {
    appendLog("WINDOW", error.stack ?? error.message);
    dialog.showErrorBox(
      "Cafe POS could not open",
      "The local user interface could not be loaded. Check the desktop log.",
    );
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowedOrigin = new URL(applicationUrl).origin;
    if (new URL(url).origin !== allowedOrigin) event.preventDefault();
  });
}

const ipcHandlers = {
  "backup:create": createManualBackup,
  "backup:restore": restoreManualBackup,
};
for (const [channel, handler] of Object.entries(ipcHandlers)) {
  ipcMain.handle(channel, handler);
}

const hasSingleInstance = app.requestSingleInstanceLock();
if (!hasSingleInstance) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    try {
      if (app.isPackaged) await startPackagedServices();
      await sessionCookieCleanup();
      createWindow();
      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
      });
    } catch (error) {
      appendLog("STARTUP", error.stack ?? error.message);
      dialog.showErrorBox(
        "Cafe POS could not start",
        `${error.message || "An unexpected startup error occurred."}\n\nLog: ${path.join(app.getPath("userData"), "logs", "desktop.log")}`,
      );
      app.quit();
    }
  });

  app.on("before-quit", (event) => {
    if (allowQuit) return;
    event.preventDefault();
    isQuitting = true;
    if (quitCleanupStarted) return;
    quitCleanupStarted = true;
    void Promise.all([stopService(clientProcess), stopService(apiProcess)]).finally(
      () => {
        allowQuit = true;
        app.quit();
      },
    );
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

async function sessionCookieCleanup() {
  const { session } = require("electron");
  await Promise.all([
    session.defaultSession.cookies.remove(
      "http://127.0.0.1:3001",
      "pos_session",
    ),
    session.defaultSession.cookies.remove("http://localhost:3001", "pos_session"),
  ]);
}
