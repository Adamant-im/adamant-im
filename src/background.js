'use strict'

import { app, protocol, BrowserWindow, Menu, systemPreferences } from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

// Standard scheme must be registered before the app is ready
// before (<= v4.x):
protocol.registerStandardSchemes(['app'], { secure: true })

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 800, height: 800, "max-width": 800, icon: path.join(__dirname, '/icon.png') })
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
  var template = [{
    label: "ADAMANT Messenger",
    submenu: [
        { label: "About", selector: "orderFrontStandardAboutPanel:" },
        { type: "separator" },
        { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
    ]}, {
    label: "Edit",
    submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]}
  ];
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    var darkMode = true;
    // if (systemPreferences.isDarkMode()) {
    //   darkMode = true;
    // }
    win.webContents.executeJavaScript("window.ep.$store.commit('options/updateOption', { key: 'darkTheme',value: "+darkMode+" })");
    systemPreferences.subscribeNotification(
      'AppleInterfaceThemeChangedNotification',
      function theThemeHasChanged () {
  	  win.webContents.executeJavaScript("window.ep.$store.commit('options/updateOption', { key: 'darkTheme',value: "+systemPreferences.isDarkMode()+" })");
      }
    )
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    app.quit()
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    await installVueDevtools()
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
