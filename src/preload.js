const { contextBridge, ipcRenderer } = require('electron')


console.log("preload the script is working")

contextBridge.exposeInMainWorld('electronAPI', {
  setAlwaysOnTop: (state) => ipcRenderer.send('setAlwaysOnTop', state)
})