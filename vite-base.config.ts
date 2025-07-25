import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import wasm from 'vite-plugin-wasm'
import path from 'node:path'
import autoprefixer from 'autoprefixer'
import inject from '@rollup/plugin-inject'
import commonjs from '@rollup/plugin-commonjs'
import { fileURLToPath } from 'node:url'

import { deferScripsPlugin } from './vite-config/plugins/deferScriptsPlugin'
import { preloadCSSPlugin } from './vite-config/plugins/preloadCSSPlugin'
import { excludeBip39Wordlists } from './vite-config/rollup/excludeBip39Wordlists'

const env = loadEnv('production', process.cwd())
const basePublicPath = env.VITE_PUBLIC_PATH || '/'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  base: basePublicPath,
  plugins: [
    wasm(),
    vue(),
    vueJsx(),
    commonjs(),
    inject({
      Buffer: ['buffer', 'Buffer']
    }),
    deferScripsPlugin(),
    preloadCSSPlugin()
  ],
  css: {
    postcss: {
      plugins: [autoprefixer()]
    },
    preprocessorOptions: {
      scss: {
        includePaths: ['./src']
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      // Node.js polyfills
      buffer: 'buffer/',
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      stream: 'stream-browserify',
      path: 'path-browserify',
      crypto: 'crypto-browserify',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser',
      assert: 'assert'
    },
    extensions: ['.tsx', '.ts', '.js', '.json', '.vue']
  },
  server: {
    port: 8080
  },
  // Some old libs like `promise-queue` and `readable-stream` still uses Webpack.
  define: {
    'process.browser': 'true',
    'process.env': {}
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      include: []
    },
    rollupOptions: {
      external: [...excludeBip39Wordlists()],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.startsWith('materialdesignicons-webfont')) {
            return 'assets/[name][extname]'
          }

          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
