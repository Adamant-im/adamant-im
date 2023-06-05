import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import autoprefixer from 'autoprefixer'
import { VitePWA } from 'vite-plugin-pwa'

import inject from '@rollup/plugin-inject'
import commonjs from '@rollup/plugin-commonjs'

export default defineConfig({
  plugins: [
    vue(),
    commonjs(),
    inject({
      Buffer: ['buffer', 'Buffer']
    }),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: 'src',
      filename: 'service-worker.js',
      devOptions: {
        enabled: false
      },
      manifest: {
        "name": "ADAMANT Messenger or ADAMANT",
        "short_name": "ADAMANT",
        "description": "ADAMANT is a decentralized anonymous messenger based on the blockchain system. It’s independent of any governments or corporations, and even developers due to the distributed network infrastructure that contains an open-source code. Apps are available on Web, Tor, App Store for iOS, Google Play for Android, Windows, Mac OS, GNU/Linux. ADAMANT Business is a private blockchain for companies. ADAMANT 2FA is a secure and reliable blockchain OTP solution for companies. ADAMANT TradeBot offers self-hosted market-making tool for crypto projects.",
        "icons": [
          {
            "src": "/img/icons/android-chrome-36x36.png",
            "sizes": "36x36",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android-chrome-48x48.png",
            "sizes": "48x48",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android-chrome-72x72.png",
            "sizes": "72x72",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android-chrome-96x96.png",
            "sizes": "96x96",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android-chrome-144x144.png",
            "sizes": "144x144",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android-chrome-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android-chrome-256x256.png",
            "sizes": "256x256",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android-chrome-384x384.png",
            "sizes": "384x384",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android-chrome-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/img/icons/android-chrome-1024x1024.png",
            "sizes": "1024x1024",
            "type": "image/png"
          }
        ],
        "dir": "ltr",
        "lang": "en",
        "orientation": "natural",
        "start_url": "/index.html",
        "display": "standalone",
        "display_override": [
          "standalone",
          "browser"
        ],
        "related_applications": [
          {
            "platform": "itunes",
            "url": "https://apps.apple.com/app/adamant-messenger/id1341473829"
          },
          {
            "platform": "play",
            "url": "https://play.google.com/store/apps/details?id=im.adamant.adamantmessengerpwa&pli=1"
          }
        ],
        "prefer_related_applications": true,
        "shortcuts": [
          {
            "name": "Wallet",
            "url": "/home",
            icons: [
              {
                "src": "/img/icons/android-chrome-96x96.png",
                "sizes": "96x96",
                "type": "image/png"
              },
            ]
          },
          {
            "name": "Chats",
            "url": "/chats",
            icons: [
              {
                "src": "/img/icons/android-chrome-96x96.png",
                "sizes": "96x96",
                "type": "image/png"
              },
            ]
          },
          {
            "name": "Settings",
            "url": "/options",
            icons: [
              {
                "src": "/img/icons/android-chrome-512x512.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any"
              }
            ]
          }
        ],
        "screenshots" : [
          {
            "src": "./img/screenshots/pwa/1-nightly.adamant.im_chats(iPhone 6_7_8) (1).png",
            "sizes": "750x1334",
            "type": "image/png",
            "platform": "ios"
          },
          {
            "src": "./img/screenshots/pwa/2-msg.adamant.im_home(iPhone 6_7_8) (3).png",
            "sizes": "750x1334",
            "type": "image/png",
            "platform": "ios"
          },
          {
            "src": "./img/screenshots/pwa/3-msg.adamant.im_home(iPhone 6_7_8) (2).png",
            "sizes": "750x1334",
            "type": "image/png",
            "platform": "ios"
          },
          {
            "src": "./img/screenshots/pwa/4-msg.adamant.im_home(iPhone 6_7_8) (2).png",
            "sizes": "750x1334",
            "type": "image/png",
            "platform": "ios"
          },
          {
            "src": "./img/screenshots/pwa/Four-4-images-adamant.png",
            "sizes": "3030x1334",
            "type": "image/png",
            "platform": "ios"
          },
          {
            "src": "./img/ios/ios1.png",
            "sizes": "1125x2436",
            "type": "image/png",
            "platform": "itunes"
          },
          {
            "src": "./img/ios/ios2.png",
            "sizes": "1125x2436",
            "type": "image/png",
            "platform": "itunes"
          },
          {
            "src": "./img/ios/ios3.png",
            "sizes": "1125x2436",
            "type": "image/png",
            "platform": "itunes"
          },
          {
            "src": "./img/ios/ios4.png",
            "sizes": "1125x2436",
            "type": "image/png",
            "platform": "itunes"
          },
          {
            "src": "./img/ios/ios5.png",
            "sizes": "1125x2436",
            "type": "image/png",
            "platform": "itunes"
          },
          {
            "src": "./img/ios/ios6.png",
            "sizes": "1125x2436",
            "type": "image/png",
            "platform": "itunes"
          },
          {
            "src": "./img/ios/ios7.png",
            "sizes": "1125x2436",
            "type": "image/png",
            "platform": "itunes"
          },
          {
            "src": "./img/ios/ios8.png",
            "sizes": "1125x2436",
            "type": "image/png",
            "platform": "ios"
          },
          {
            "src": "./img/ios/ios9.png",
            "sizes": "1125x2436",
            "type": "image/png",
            "platform": "itunes"
          },
          {
            "src": "./img/ios/ios10.png",
            "sizes": "1125x2436",
            "type": "image/png",
            "platform": "itunes"
          },
          {
            "src": "./img/ios/ios11.png",
            "sizes": "1125x2436",
            "type": "image/png",
            "platform": "itunes"
          },
          {
            "src": "./img/ios/ios12.png",
            "sizes": "1125x2436",
            "type": "image/png",
            "platform": "itunes"
          },
          {
            "src": "./img/android/0-login.png",
            "sizes": "750x1334",
            "type": "image/png",
            "platform": "play"
          },
          {
            "src": "./img/android/1-balances.png",
            "sizes": "750x1334",
            "type": "image/png",
            "platform": "play"
          },
          {
            "src": "./img/android/2-exchanges.png",
            "sizes": "750x1334",
            "type": "image/png",
            "platform": "play"
          },
          {
            "src": "./img/android/3-send_funds.png",
            "sizes": "750x1334",
            "type": "image/png",
            "platform": "play"
          },
          {
            "src": "./img/android/4-partners.png",
            "sizes": "750x1334",
            "type": "image/png",
            "platform": "play"
          },
          {
            "src": "./img/android/5-start_new_chat.png",
            "sizes": "750x1334",
            "type": "image/png",
            "platform": "play"
          },
          {
            "src": "./img/android/6-nodes.png",
            "sizes": "750x1334",
            "type": "image/png",
            "platform": "play"
          },
          {
            "src": "./img/android/7-votes.png",
            "sizes": "750x1334",
            "type": "image/png",
            "platform": "play"
          },
        ],
        "share_target": {
          "action": "/home",
          "params": {
            "title": "ADAMANT",
            "text": "ADAMANT is a unique product—it's the only Private Messenger operating entirely on a Blockchain."
          }
        },
        "scope": "https://msg.adamant.im",
        "categories": ["finance", "social", "crypto", "security", "blockchain"],
        "background_color": "#000000",
        "theme_color": "#4DBA87"
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
    extensions: ['.js', '.json', '.vue']
  },
  server: {
    port: 8080
  },
  define: {
    'process.env': {} // some old libs like `promise-queue` still uses Webpack
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
    commonjsOptions: {
      include: []
    }
  }
})
