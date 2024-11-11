import { app, BrowserWindow, globalShortcut, ipcMain, Menu, nativeImage, Tray } from 'electron'
import { startServer } from './server.js'
import path, { dirname } from "path"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function makeTray() {
    let tray
    const icon = nativeImage.createFromPath("src/public/assets/icon.png")
    tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Quit', type: 'normal', click: () => app.quit() },
    ])
    tray.setToolTip('Fox')
    tray.on("click", () => {
        console.log("clicked")
    })
    tray.setContextMenu(contextMenu)
}

function registerShortcuts(){
    globalShortcut.register('F8', () => {
        console.log('Electron loves global shortcuts!')
    })
    globalShortcut.register('Shift+F8', () => {
        createWritingToolsWindow()
    })
}

function createWritingToolsWindow(){
    console.log(path.join(__dirname, 'src/preload.js'))
    const win = new BrowserWindow({
        titleBarStyle: "hidden",
        backgroundColor: "#00000000",
        transparent: true,
        vibrancy: process.platform == "darwin" && "under-window", // in my case...
        visualEffectState: process.platform == "darwin" && "followWindow",
        backgroundMaterial: process.platform == "win32" && "acrylic",
        resizable: true,
        width: 267,
        height: 248,
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js'),
        }
    })
    win.webContents.openDevTools()
    win.setWindowButtonVisibility(false)

    win.on("blur", ()=>{
        if (win.isAlwaysOnTop() == false){
            win.close()
        }
    })
    ipcMain.on('setAlwaysOnTop', (event, state) => {
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        win.setAlwaysOnTop(state)
    })
    win.loadFile('src/writingTools.html')
}

app.whenReady().then(() => {
    makeTray();
    registerShortcuts();
    startServer(app)
})

app.on('window-all-closed', () => {

})

