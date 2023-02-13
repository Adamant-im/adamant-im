import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue'
import path from "path";
import autoprefixer from 'autoprefixer'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

export default defineConfig({
  plugins: [vue()],
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
      events: 'rollup-plugin-node-polyfills/polyfills/events'
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
