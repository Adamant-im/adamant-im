import { app, BrowserWindow, Menu, nativeTheme, protocol } from 'electron'
import { fileURLToPath, URL } from 'node:url'
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer'
import path from 'node:path'
import { readFile } from 'node:fs'

const SCHEME = 'app'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected
let appWindow

// Standard scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      allowServiceWorkers: true
    }
  }
])

// @source: https://github.com/nklayman/vue-cli-plugin-electron-builder/blob/master/lib/createProtocol.js
function createProtocol(scheme, customProtocol) {
  ;(customProtocol || protocol).registerBufferProtocol(scheme, (request, respond) => {
    let pathName = new URL(request.url).pathname
    pathName = decodeURI(pathName) // Needed in case URL contains spaces

    readFile(path.join(__dirname, pathName), (error, data) => {
      if (error) {
        console.error(`Failed to read ${pathName} on ${scheme} protocol`, error)
      }
      const extension = path.extname(pathName).toLowerCase()
      let mimeType = ''

      if (extension === '.js') {
        mimeType = 'text/javascript'
      } else if (extension === '.html') {
        mimeType = 'text/html'
      } else if (extension === '.css') {
        mimeType = 'text/css'
      } else if (extension === '.svg' || extension === '.svgz') {
        mimeType = 'image/svg+xml'
      } else if (extension === '.json') {
        mimeType = 'application/json'
      } else if (extension === '.wasm') {
        mimeType = 'application/wasm'
      }

      respond({ mimeType, data })
    })
  })
}

function createWindow() {
  // Create the browser window
  appWindow = new BrowserWindow({
    name: 'ADAMANT Messenger',
    width: 800,
    height: 800,
    minWidth: 380,
    minHeight: 624,
    icon: path.join(__dirname, '/icon.png')
  })

  // You can use `process.env.VITE_DEV_SERVER_URL` when the vite command is called `serve`
  if (process.env.VITE_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    appWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    appWindow.webContents.openDevTools()
  } else {
    // Load the index.html when not in development
    createProtocol(SCHEME)
    appWindow.loadURL(`${SCHEME}://./index.html`)
  }

  appWindow.on('closed', () => {
    appWindow = null
  })

  const template = [
    {
      label: 'ADAMANT Messenger',
      submenu: [
        { label: 'About ADAMANT Messenger', selector: 'orderFrontStandardAboutPanel:' },
        {
          label: 'Hide',
          accelerator: 'Command+H',
          click: function () {
            app.hide()
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: function () {
            app.quit()
          }
        }
      ]
    },
    {
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
    }
  ]

  const darkMode = nativeTheme.shouldUseDarkColors
  appWindow.webContents.executeJavaScript(
    "store.commit('options/updateOption', { key: 'darkTheme', value: " + darkMode + ' })'
  )
  nativeTheme.on('updated', function theThemeHasChanged() {
    appWindow.webContents.executeJavaScript(
      "store.commit('options/updateOption', { key: 'darkTheme', value: " +
        nativeTheme.shouldUseDarkColors +
        ' })'
    )
  })

  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
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
  if (import.meta.env.DEV) {
    // Install Vue Devtools
    installExtension(REDUX_DEVTOOLS, { loadExtensionOptions: { allowFileAccess: true } })
      .then((name) => console.log(`Electron extensions: added ${name}`))
      .catch((err) => console.log('Electron extensions: an error occurred: ', err))
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode
if (import.meta.env.DEV) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
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
