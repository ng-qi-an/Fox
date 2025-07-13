import { app, BrowserWindow, globalShortcut, ipcMain, Menu, nativeImage, screen, Tray } from 'electron'
import path, { dirname } from "path"
import { fileURLToPath } from 'url';
import serve from 'electron-serve';
import { getSelectedText } from 'node-get-selected-text'
import { initialiseWritingToolsIPC } from './modules/writingTools.js';
import { initialiseWindowsIPC } from './modules/windows.js';
import { initialiseChatIPC } from './modules/chat.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appIcon = `${app.isPackaged ? process.resourcesPath + "/" : ""}${process.platform == "win32" ? 'icon.ico' : 'icon.png'}`


const appServe = app.isPackaged ? serve({
  directory: path.join(__dirname, "../out"),
}) : null;

function makeTray() {
    let tray
    const icon = nativeImage.createFromPath(appIcon)
    tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Quit', type: 'normal', click: () => app.quit() },
    ])
    tray.setToolTip('Fox')
    tray.on("click", () => {
        createPromptWindow()
    })
    tray.setContextMenu(contextMenu)
}

function registerShortcuts(){
  globalShortcut.register('F8', () => {
      createPromptWindow()
  })
  globalShortcut.register('Shift+F8', () => {
      createWritingToolsWindow()
  })
}


async function createPromptWindow(){
  const display = screen.getPrimaryDisplay().bounds
    const win = new BrowserWindow({
        titleBarStyle: "hidden",
        backgroundColor: "#99000000",
        icon: appIcon,
        transparent: process.platform == "darwin" && true,
        vibrancy: process.platform == "darwin" && "under-window", // in my case...
        visualEffectState: process.platform == "darwin" && "followWindow",
        backgroundMaterial: process.platform == "win32" && "acrylic",
        resizable: true,
        width: 400,
        height: 64,
        x: display.width -420,
        y: display.height - 120,
        webPreferences: {
            preload: path.join( __dirname, 'preload.js'),
        }
    })
    // win.webContents.openDevTools()
    if (process.platform == 'darwin'){
        win.setWindowButtonVisibility(false)
    }

    // win.on("blur", ()=>{
    //     if (win.isAlwaysOnTop() == false){
    //         win.close()
    //     }
    // })

    if (app.isPackaged) {
      await appServe(win, {route: "prompt"})
    } else {
      win.loadURL("http://localhost:3000/prompt");
      win.webContents.on("did-fail-load", (e, code, desc) => {
        win.webContents.reloadIgnoringCache();
      });
    }
}

async function createWritingToolsWindow(){
    var selection = null
    try {
        selection = getSelectedText()
        if (!selection){
            throw new Error('No text selected')
        }
    } catch (error) {
        console.error('Error:', error);
        return
    }
    const cursor = screen.getCursorScreenPoint()
    const win = new BrowserWindow({
        titleBarStyle: "hidden",
        backgroundColor: "#4c000000",
        icon: appIcon,
        transparent: process.platform == "darwin" && true,
        vibrancy: process.platform == "darwin" && "under-window", // in my case...
        visualEffectState: process.platform == "darwin" && "followWindow",
        backgroundMaterial: process.platform == "win32" && "acrylic",
        width: 267,
        resizable: true,
        height: 248,
        x: cursor.x + 10,
        y: cursor.y - 248/2,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        }
    })
    ipcMain.on("getSelection", (event)=>{
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        win.webContents.send("getSelection", selection)
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
    
    if (app.isPackaged) {
      await appServe(win, {route: "writingTools"})
    } else {
      win.loadURL("http://localhost:3000/writingTools");
      win.webContents.on("did-fail-load", (e, code, desc) => {
        win.webContents.reloadIgnoringCache();
      });
    }
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  if (app.isPackaged) {
    appServe(win, {writingTools: true}).then(() => {
      win.loadURL("app://-");
    });
  } else {
    win.loadURL("http://localhost:3000/writingTools");
    win.webContents.openDevTools();
    win.webContents.on("did-fail-load", (e, code, desc) => {
      win.webContents.reloadIgnoringCache();
    });
  }
}

app.whenReady().then(() => {
    makeTray();
    registerShortcuts();
    initialiseWritingToolsIPC(app);
    initialiseWindowsIPC(app);
    initialiseChatIPC(app);
    console.log("Fox has started!")
})

app.on('window-all-closed', () => {

})