const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  setAlwaysOnTop: (state) => ipcRenderer.send('setAlwaysOnTop', state)
})