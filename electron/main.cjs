const { app, BrowserWindow, Menu, dialog, session } = require("electron");
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
    await session.defaultSession.cookies.remove(
      "http://localhost:3001",
      "pos_session",
    );
  } catch (error) {
    console.error("Failed to clear the previous POS login cookie:", error);
    dialog.showErrorBox(
      "Unable to secure startup",
      "Cafe POS could not clear the previous login. The app will close without opening.",
    );
    app.quit();
    return;
  }

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
