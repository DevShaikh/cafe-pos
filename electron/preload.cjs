const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cafePosDesktop", {
  createBackup: () => ipcRenderer.invoke("backup:create"),
  restoreBackup: () => ipcRenderer.invoke("backup:restore"),
});
