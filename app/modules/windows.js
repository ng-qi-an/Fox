import { BrowserWindow, ipcMain } from "electron"

export function initialiseWindowsIPC(app){
    ipcMain.on('setAlwaysOnTop', (event, state) => {
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        win.setAlwaysOnTop(state)
    })
    ipcMain.on('closeWindow', (event) => {
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        win.close()
    })
    ipcMain.on('minimiseWindow', (event) => {
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        win.minimize()
    })
    ipcMain.on("createResponseWindow", (event, promptText)=>{
        createResponseWindow()
    })
    ipcMain.on("resizeWindow", (event, size)=>{
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        win.setSize(size.width || win.getSize()[0], size.height || win.getSize()[1])
    })
    ipcMain.on("moveWindow", (event, offset)=>{
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        win.setPosition(win.getPosition()[0] + (offset.x || 0), win.getPosition()[1] + (offset.y || 0))
    })
    ipcMain.on("displayResponse", (event, response)=>{
        activeResponseWindow.webContents.send("displayResponse", response)
    })
}
