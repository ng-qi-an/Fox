import { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, nativeImage, Notification, screen, Tray } from 'electron'
import path, { dirname } from "path"
import { fileURLToPath } from 'url';
import serve from 'electron-serve';
import { getSelectedText } from 'node-get-selected-text'
import { initialiseWritingToolsIPC } from './modules/writingTools.js';
import { initialiseWindowsIPC } from './modules/windows.js';
import { initialiseChatIPC } from './modules/chat.js';
import { startServer } from './server.js';
import electronUpdater from 'electron-updater';
import Store from 'electron-store';
import { validateConfig, initialiseConfigIPC } from './modules/config.js';
import { exit } from 'process';
const { autoUpdater } = electronUpdater;

autoUpdater.autoDownload = false;

app.requestSingleInstanceLock() // Ensure only one instance of the app is running

if (app.isPackaged){
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath("exe"),
    args: ['--hidden']
  })
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appIcon = `${app.isPackaged ? process.resourcesPath + "/" : ""}buildResources/${process.platform == "win32" ? 'icon.ico' : 'icon.png'}`
const templateAppIcon = `${app.isPackaged ? process.resourcesPath + "/" : ""}buildResources/${process.platform == "win32" ? 'icon.ico' : 'iconTemplate.png'}`
const store = new Store();

var activePromptWindow = null;
var activeWritingToolsWindow = null;


app.on('second-instance', (event) => {
  if (activePromptWindow) {
    if (activePromptWindow.isMinimized()) activePromptWindow.restore();
    activePromptWindow.focus();
  }
})

ipcMain.on('closeWindow', (event, type) => {
    const webContents = event.sender
    const win = BrowserWindow.fromWebContents(webContents)
    if (type == 'prompt') {
        if (activePromptWindow) {
            win.close()
            activePromptWindow = null
        }
    } else if (type == 'writingTools') {
        if (activeWritingToolsWindow) {
            win.close()
            activeWritingToolsWindow = null
        }
    } else {
        win.close()
    }
    win.close()
})

ipcMain.on("saveConfig", (event, config) => {
    const webContents = event.sender
    const win = BrowserWindow.fromWebContents(webContents)
    store.set(config);
    win.webContents.send("saveConfig", {'status': 'OK'})
})

const appServe = app.isPackaged ? serve({
  directory: path.join(__dirname, "../out"),
}) : null;

function makeTray() {
    let tray
    console.log(templateAppIcon)
    const icon = nativeImage.createFromPath(templateAppIcon)
    tray = new Tray(icon.resize({ width: 16, height: 16 }))
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open Chat', type: 'normal', click: () =>  {
            if (!activePromptWindow) {
                createPromptWindow()
            }
        }},
        { label: "Settings", type: 'normal', click:()=>{
          createSettingsWindow()
        }},
        { label: 'Quit', type: 'normal', click: () => app.quit() },
    ])
    tray.setToolTip('Fox')
    tray.on("click", () => {
        createPromptWindow()
    })
    if (process.platform == 'win32'){
      tray.setContextMenu(contextMenu)
    }
}

function registerShortcuts(){
  globalShortcut.register('F8', () => {
    if (!activePromptWindow) {
      createPromptWindow()
    } else {
      if (activePromptWindow.isMinimized()) {
        activePromptWindow.restore();
      }
      activePromptWindow.focus();
    }
  })
  globalShortcut.register('Shift+F8', () => {
    if (!activeWritingToolsWindow) {
      createWritingToolsWindow()
    }
  })
}

async function createSettingsWindow(){
  const win = new BrowserWindow({
    titleBarStyle: "hidden",
    backgroundColor: "#99000000",
    icon: appIcon,
    transparent: process.platform == "darwin" && true,
    vibrancy: process.platform == "darwin" && "under-window",
    visualEffectState: process.platform == "darwin" && "followWindow",
    backgroundMaterial: process.platform == "win32" && "acrylic",
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    }
  })
  if (app.isPackaged) {
    await appServe(win, {route: "settings"})
  } else {
    win.loadURL("http://localhost:3000/settings");
    win.webContents.on("did-fail-load", (e, code, desc) => {
      win.webContents.reloadIgnoringCache();
    });
  }
}


async function createPromptWindow(){
    var noBlur = false;

    function noblur(event, state){
        noBlur = state;
    }
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
        x: process.platform == "win32" ? display.width - 410 : display.width - 405,
        y: process.platform == "win32" ? display.height - 120 : 30,
        webPreferences: {
            preload: path.join( __dirname, 'preload.js'),
        }
    })
    activePromptWindow = win;
    // win.webContents.openDevTools()
    if (process.platform == 'darwin'){
        win.setWindowButtonVisibility(false)
    }

    win.on("blur", ()=>{
        if (win.isAlwaysOnTop() == false && noBlur == false){
            win.close()
            activePromptWindow = null;
        }
    })

    win.on("close", ()=>{
        ipcMain.off("noBlur", noblur)
        activePromptWindow = null;
    })

    ipcMain.on("noBlur", noblur)
    

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
        width: 260,
        resizable: true,
        height: 289,
        x: cursor.x + 10,
        y: cursor.y - 248/2,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        }
    })
    activeWritingToolsWindow = win;
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
            activeWritingToolsWindow = null;
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

async function createSetupWindow(){
  const win = new BrowserWindow({
    titleBarStyle: "hidden",
    backgroundColor: "#99000000",
    icon: appIcon,
    transparent: process.platform == "darwin" && true,
    vibrancy: process.platform == "darwin" && "under-window", // in my case...
    visualEffectState: process.platform == "darwin" && "followWindow",
    backgroundMaterial: process.platform == "win32" && "acrylic",
    width: 700,
    height: 600,
    webPreferences: {
        preload: path.join( __dirname, 'preload.js'),
    }
  })
  win.center()

  if (app.isPackaged) {
    await appServe(win, {route: "setup"})
  } else {
    win.loadURL("http://localhost:3000/setup");
    win.webContents.on("did-fail-load", (e, code, desc) => {
      win.webContents.reloadIgnoringCache();
    });
  }
  return win;
}

async function createUpdaterWindow(){
  const win = new BrowserWindow({
    titleBarStyle: "hidden",
    backgroundColor: "#99000000",
    icon: appIcon,
    transparent: process.platform == "darwin" && true,
    vibrancy: process.platform == "darwin" && "under-window", // in my case...
    visualEffectState: process.platform == "darwin" && "followWindow",
    backgroundMaterial: process.platform == "win32" && "acrylic",
    width: 250,
    height: 270,
    resizable: false,
    webPreferences: {
        preload: path.join( __dirname, 'preload.js'),
    }
  })
  win.center()

  if (app.isPackaged) {
    await appServe(win, {route: "updater"})
  } else {
    win.loadURL("http://localhost:3000/updater");
    win.webContents.on("did-fail-load", (e, code, desc) => {
      win.webContents.reloadIgnoringCache();
    });
  }
  return win;
}

function updateApp(){
  console.log("[INFO](UPDATER) Checking for updates...")
  autoUpdater.checkForUpdates()
  var downloaded = false;
  var updaterWindow = null;
  autoUpdater.on('update-downloaded', () => {
    console.log("[INFO](UPDATER) Update downloaded")
    downloaded = true
    updaterWindow.webContents.send("downloadComplete")
  });
  autoUpdater.on('update-not-available', () => {
    console.log("[INFO](UPDATER) No updates available")
  })
  autoUpdater.on('update-available', async() => {
    console.log("[INFO](UPDATER) Update available")
    const response = await dialog.showMessageBox({
      type: "question",
      title: "Update Available",
      message: "A new update is available. Do you want to download and install it now?",
      buttons: ["Yes", "No"],
    })
    if (response.response == 0){
      updaterWindow = await createUpdaterWindow()
      autoUpdater.downloadUpdate();
      autoUpdater.on("download-progress", (progress)=>{
        console.log("[INFO](UPDATER) Download progress:", progress);
        updaterWindow.webContents.send("downloadProgress", progress);
      })
      ipcMain.on("getDownloadStatus", (event)=>{
        console.log("[INFO](UPDATER) Download status requested")
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        if (downloaded) {
          win.webContents.send("downloadComplete")
        }
      })
      ipcMain.on("readyInstall", ()=>{
        console.log("[INFO](UPDATER) Ready to install update")
        autoUpdater.quitAndInstall();
      })
    }
  })
}

app.whenReady().then(async() => {
    // Check if configured
    if (app.isPackaged){
      updateApp();
    }
    initialiseConfigIPC(app);
    const result = await validateConfig(app);
    
    if (result == "SETUP") {
      const setupWindow = await createSetupWindow();
      await new Promise((resolve, reject) => {
        var closeSetup = true;
        setupWindow.on("closed", ()=>{
          if (closeSetup) {
            app.exit(0)
          }
        })
        ipcMain.once("saveConfig", (event, config) => {
          store.set("version", app.getVersion())
          const webContents = event.sender
          const win = BrowserWindow.fromWebContents(webContents)
          setTimeout(()=>{
            closeSetup = false;
            win.close()
            resolve(config);
          }, 100)
        })
      });
    }
    makeTray();
    registerShortcuts();
    initialiseWritingToolsIPC(app);
    initialiseWindowsIPC(app);
    initialiseChatIPC(app);
    startServer(app);
    console.log("Fox has started!")
})

app.on('window-all-closed', () => {

})