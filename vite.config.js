import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue'
import path from "path";
import autoprefixer from 'autoprefixer'

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
    },
    extensions: ['.vue']
  },
  server: {
    port: 8080
  }
});
