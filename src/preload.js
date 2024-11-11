const { contextBridge, ipcRenderer } = require('electron')


console.log("preload the script is working")

contextBridge.exposeInMainWorld('electronAPI', {
  setAlwaysOnTop: (state) => ipcRenderer.send('setAlwaysOnTop', state),
  closeWindow: () => ipcRenderer.send('closeWindow'),
  getSelection: () => ipcRenderer.send('getSelection'),
  onGetSelection: (callback) => ipcRenderer.on('getSelection', (_event, value) => callback(value)),
})