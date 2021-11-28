'use strict'

import { app, protocol, BrowserWindow, Menu, systemPreferences, nativeTheme } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected
let appWindow

// Standard scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    bypassCSP: true,
    allowServiceWorkers: true
  }
}])

function createWindow () {
  // Create the browser window
  appWindow = new BrowserWindow({ width: 800, height: 800, 'max-width': 800, icon: path.join(__dirname, '/icon.png') })
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    appWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    appWindow.webContents.openDevTools()
  } else {
    // Load the index.html when not in development
    appWindow.webContents.openDevTools()
    createProtocol('app')
    appWindow.loadURL('app://./index.html')
  }

  appWindow.on('closed', () => {
    appWindow = null
  })

  const template = [{
    label: 'ADAMANT Messenger',
    submenu: [
      { label: 'About ADAMANT Messenger', selector: 'orderFrontStandardAboutPanel:' },
      { label: 'Hide', accelerator: 'Command+H', click: function () { app.hide() } },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'Command+Q', click: function () { app.quit() } }
    ]
  }, {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
      { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
    ]
  }]

  const darkMode = nativeTheme.shouldUseDarkColors
  appWindow.webContents.executeJavaScript("window.ep.$store.commit('options/updateOption', { key: 'darkTheme', value: " + darkMode + ' })')
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
    systemPreferences.subscribeNotification(
      'AppleInterfaceThemeChangedNotification',
      function theThemeHasChanged () {
        appWindow.webContents.executeJavaScript("window.ep.$store.commit('options/updateOption', { key: 'darkTheme', value: " + !nativeTheme.shouldUseDarkColors + ' })')
      }
    )
  }
}

// Quit when all windows are closed
app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open
  if (appWindow === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment) {
    // Install Vue Devtools
    installExtension(REDUX_DEVTOOLS, { loadExtensionOptions: { allowFileAccess: true } })
      .then((name) => console.log(`Electron extensions: added ${name}`))
      .catch((err) => console.log('Electron extensions: an error occurred: ', err))
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode
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
