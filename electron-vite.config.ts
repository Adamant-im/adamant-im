import { defineConfig, mergeConfig } from 'vite'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import viteBaseConfig from './vite-base.config.ts'
import { excludeScreenshotsPlugin } from './vite-config/plugins/excludeScreenshotsPlugin.ts'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const electron = require('vite-plugin-electron')
  .default as typeof import('vite-plugin-electron').default
const electronDevCspHeader = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `script-src 'self' 'wasm-unsafe-eval'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: http: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' ws: wss: http: https: blob:`,
  `worker-src 'self' blob:`,
  `media-src 'self' data: blob:`
].join('; ')

export default mergeConfig(
  viteBaseConfig,
  defineConfig({
    cacheDir: 'node_modules/.vite-electron',
    server: {
      headers: {
        'Content-Security-Policy': electronDevCspHeader
      }
    },
    preview: {
      headers: {
        'Content-Security-Policy': electronDevCspHeader
      }
    },
    build: {
      outDir: './dist-electron'
    },
    plugins: [
      electron([
        {
          entry: 'src/electron/main.js',
          // The main process bundle is built separately and does not inherit the base config's
          // aliases. It needs `@` so that the URI scheme allowlist can be imported from the same
          // module the renderer uses, instead of being duplicated and drifting.
          vite: {
            resolve: {
              alias: {
                '@': path.resolve(__dirname, './src')
              }
            },
            // electron-devtools-installer is CommonJS and calls require('electron'). Bundling it
            // into an ESM main process leaves a runtime require shim that cannot execute.
            build: {
              rolldownOptions: {
                external: ['electron-devtools-installer']
              }
            }
          }
        },
        {
          entry: 'src/electron/preload.ts',
          vite: {
            build: {
              lib: {
                formats: ['cjs'],
                fileName: () => 'preload.cjs'
              }
            }
          }
        }
      ]),
      excludeScreenshotsPlugin()
    ]
  })
)
