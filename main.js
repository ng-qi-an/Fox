import { app, BrowserWindow, globalShortcut, ipcMain, Menu, nativeImage, Tray } from 'electron'
import { startServer } from './server.js'
import path, { dirname } from "path"
import { fileURLToPath } from 'url';
import { getSelection } from 'node-selection';


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

async function createWritingToolsWindow(){
    var selection = null
    try {
        selection = await getSelection();
        if (!selection.text){
            throw new Error('No text selected')
        }
    } catch (error) {
        console.error('Error:', error);
        return
    }
    const win = new BrowserWindow({
        titleBarStyle: "hidden",
        backgroundColor: "#00000000",
        transparent: process.platform == "darwin" && true,
        vibrancy: process.platform == "darwin" && "under-window", // in my case...
        visualEffectState: process.platform == "darwin" && "followWindow",
        backgroundMaterial: process.platform == "win32" && "mica",
        resizable: true,
        width: 267,
        height: 248,
        webPreferences: {
            preload: path.join( __dirname, 'src/preload.js'),
        }
    })
    //win.webContents.openDevTools()
    if (process.platform == 'darwin'){
        win.setWindowButtonVisibility(false)
    }

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
    ipcMain.on('closeWindow', (event) => {
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        win.close()
    })
    ipcMain.on("getSelection", (event)=>{
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        win.webContents.send("getSelection", selection.text)
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

