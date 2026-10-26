const { app, BrowserWindow, Menu, session } = require("electron"); // 1. Imported session
const path = require("path");

Menu.setApplicationMenu(null);

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: "Cafe POS",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "../build/icon.png"),
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:3001");
  } else {
    win.loadURL("http://localhost:3001");
  }
};

app.whenReady().then(async () => {
  try {
    // 2. Wipe storage data (localstorage, cookies, indexeddb, etc.) before creating the window
    await session.defaultSession.clearStorageData({
      storages: ["localstorage", "cookies", "indexdb", "websql", "appcache"],
    });
  } catch (error) {
    console.error("Failed to clear session storage:", error);
  }

  // 3. Launch window once the clean state is ready
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
