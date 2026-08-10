import { app, BrowserWindow, Menu, protocol, shell } from 'electron'
import { fileURLToPath, URL } from 'node:url'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import path from 'node:path'
import { readFile } from 'node:fs/promises'

// The one place URI schemes are defined, shared with the renderer and derived from
// `adamant-wallets`. Hardcoding a second copy here is what silently blocked the `ethereum:`,
// `dash:` and `doge:` links the app itself generates.
import { ALLOWED_URI_PROTOCOLS } from '@/lib/uriSchemes'

const SCHEME = 'app'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Electron main process runs in Node.js context, so browser logger dependencies are not used here.
const logInfo = (...args) => console.info('[electron-main]', ...args)
const useLegacyChromeDevtoolsExtension =
  process.env.ELECTRON_USE_CHROME_DEVTOOLS_EXTENSION === 'true'
const suppressChromiumLogs = process.env.ELECTRON_SUPPRESS_CHROMIUM_LOGS !== 'false'
const mimeTypes = {
  '.js': 'text/javascript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.svgz': 'image/svg+xml',
  '.json': 'application/json',
  '.wasm': 'application/wasm'
}
const electronRendererCsp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `script-src 'self' 'wasm-unsafe-eval'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: http: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' ws: wss: http: https: blob:`,
  `worker-src 'self' blob:`,
  `media-src 'self' data: blob: http: https:`
].join('; ')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected
let appWindow

if (import.meta.env.DEV) {
  app.commandLine.appendSwitch(
    'disable-features',
    'AutofillServerCommunication,AutofillEnableAccountWalletStorage'
  )

  if (suppressChromiumLogs) {
    app.commandLine.appendSwitch('log-level', '3')
  }
}

// Standard scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      allowServiceWorkers: true
    }
  }
])

// Adapted from https://github.com/nklayman/vue-cli-plugin-electron-builder/blob/master/lib/createProtocol.js
function createProtocol(scheme, customProtocol) {
  const targetProtocol = customProtocol || protocol
  if (targetProtocol.isProtocolHandled(scheme)) {
    return
  }

  targetProtocol.handle(scheme, async (request) => {
    const staticRoot = path.resolve(__dirname)
    const pathName = decodeURI(new URL(request.url).pathname) // Needed in case URL contains spaces

    // `path.join(__dirname, pathName)` let a compromised renderer walk out of the bundle
    // directory: `new URL('app://./../../etc/passwd').pathname` normalizes to an absolute
    // path, and on Windows a percent-encoded backslash survives `decodeURI` and is treated
    // as a separator. `path.resolve` canonicalizes every form, and the prefix check rejects
    // anything that still lands outside the bundle.
    const filePath = path.resolve(staticRoot, '.' + pathName)

    if (filePath !== staticRoot && !filePath.startsWith(staticRoot + path.sep)) {
      return new Response('Forbidden', {
        status: 403,
        headers: { 'content-type': 'text/plain' }
      })
    }

    try {
      const data = await readFile(filePath)
      const extension = path.extname(filePath).toLowerCase()
      const mimeType = mimeTypes[extension] || 'text/plain'
      const headers = {
        'content-type': mimeType
      }

      if (extension === '.html') {
        headers['content-security-policy'] = electronRendererCsp
      }

      return new Response(data, {
        headers
      })
    } catch (error) {
      console.error(`Failed to read ${pathName} on ${scheme} protocol`, error)
      return new Response('Not Found', {
        status: 404,
        headers: {
          'content-type': 'text/plain'
        }
      })
    }
  })
}

function isInternalUrl(url) {
  if (url.startsWith(`${SCHEME}://`)) return true

  return Boolean(process.env.VITE_DEV_SERVER_URL && url.startsWith(process.env.VITE_DEV_SERVER_URL))
}

/**
 * Keeps remote content out of the application window.
 *
 * Without this, a link in a chat message — or a script that reached the renderer — can
 * navigate the window itself to an arbitrary origin. The renderer CSP is attached to `.html`
 * responses served over the `app://` protocol, so after such a navigation the desktop app
 * would be showing remote content with no CSP at all. `window.open` would likewise spawn a
 * second Electron window for the target site instead of handing it to the system browser.
 */
function restrictNavigation(webContents) {
  webContents.setWindowOpenHandler(({ url }) => {
    try {
      if (ALLOWED_URI_PROTOCOLS.has(new URL(url).protocol)) {
        void shell.openExternal(url)
      } else {
        logInfo('Blocked window.open for an unsupported protocol:', url)
      }
    } catch (error) {
      logInfo('Blocked window.open for an unparsable URL:', url, error)
    }

    return { action: 'deny' }
  })

  webContents.on('will-navigate', (event, url) => {
    if (isInternalUrl(url)) return

    event.preventDefault()

    try {
      if (ALLOWED_URI_PROTOCOLS.has(new URL(url).protocol)) {
        void shell.openExternal(url)
        return
      }
    } catch {
      // fall through to the log below
    }

    logInfo('Blocked in-app navigation to:', url)
  })

  webContents.on('will-attach-webview', (event) => {
    // The application does not use <webview>; anything that tries to attach one is hostile
    event.preventDefault()
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
    icon: path.join(__dirname, '/icon.png'),
    // These are the current Electron defaults. They are stated explicitly so that a future
    // Electron upgrade, or a copy of this config, cannot silently relax them.
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  restrictNavigation(appWindow.webContents)

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
  if (import.meta.env.DEV && useLegacyChromeDevtoolsExtension) {
    // Install Vue Devtools
    installExtension(VUEJS_DEVTOOLS, { loadExtensionOptions: { allowFileAccess: true } })
      .then((name) => logInfo(`Electron extensions: added ${name}`))
      .catch((err) => logInfo('Electron extensions: an error occurred:', err))
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
