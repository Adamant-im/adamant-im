import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue'
import path from "path";
import autoprefixer from 'autoprefixer'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: 'src',
      filename: 'service-worker.js',
      devOptions: {
        enabled: true
      }
    })
  ],
  css: {
    postcss: {
        plugins: [autoprefixer()]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      
      // Node.js polyfills
      buffer: 'buffer',
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      stream: 'stream-browserify',
      path: 'path-browserify',
      crypto: 'crypto-browserify',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser'
    },
    extensions: ['.js', '.json', '.vue']
  },
  server: {
    port: 8080
  },
  define: {
    "process.env": {} // some old libs like `promise-queue` still uses Webpack
  },
  optimizeDeps: {
    esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
            global: 'globalThis'
        },
        // Enable esbuild polyfill plugins
        plugins: [
            NodeGlobalsPolyfillPlugin({
                process: false,
                buffer: true
            }),
        ]
    }
  }
});
