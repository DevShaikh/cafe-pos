const { app, BrowserWindow, Menu } = require("electron");
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
    // Better icon handling
    icon: path.join(__dirname, "../build/icon.png"), // or .ico
  });

  // Development
  if (!app.isPackaged) {
    win.loadURL("http://localhost:3001");
    // win.webContents.openDevTools(); // optional
  } else {
    // Production - you will need to adjust this later
    win.loadURL("http://localhost:3001"); // temporary
  }
};

app.whenReady().then(() => {
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
