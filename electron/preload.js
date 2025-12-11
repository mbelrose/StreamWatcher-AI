
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  launchCommand: (command) => ipcRenderer.invoke('launch-command', command),
  readConfig: () => ipcRenderer.invoke('read-config')
});
