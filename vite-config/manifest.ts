import { ManifestOptions } from 'vite-plugin-pwa'

export const manifest: Partial<ManifestOptions> = {
  name: 'ADAMANT Messenger',
  short_name: 'ADAMANT',
  description:
    'ADAMANT is a decentralized anonymous messenger based on the blockchain system. It’s independent of any governments or corporations, and even developers due to the distributed network infrastructure that contains an open-source code.',
  icons: [
    {
      src: '/img/icons/android-chrome-36x36.png',
      sizes: '36x36',
      type: 'image/png'
    },
    {
      src: '/img/icons/android-chrome-48x48.png',
      sizes: '48x48',
      type: 'image/png'
    },
    {
      src: '/img/icons/android-chrome-72x72.png',
      sizes: '72x72',
      type: 'image/png'
    },
    {
      src: '/img/icons/android-chrome-96x96.png',
      sizes: '96x96',
      type: 'image/png'
    },
    {
      src: '/img/icons/android-chrome-144x144.png',
      sizes: '144x144',
      type: 'image/png'
    },
    {
      src: '/img/icons/android-chrome-192x192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/img/icons/android-chrome-256x256.png',
      sizes: '256x256',
      type: 'image/png'
    },
    {
      src: '/img/icons/android-chrome-384x384.png',
      sizes: '384x384',
      type: 'image/png'
    },
    {
      src: '/img/icons/android-chrome-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/img/icons/android-chrome-1024x1024.png',
      sizes: '1024x1024',
      type: 'image/png'
    }
  ],
  dir: 'ltr',
  lang: 'en',
  orientation: 'natural',
  start_url: '/index.html',
  display: 'standalone',
  display_override: ['standalone', 'browser'],
  related_applications: [
    {
      platform: 'itunes',
      url: 'https://apps.apple.com/app/adamant-messenger/id1341473829'
    },
    {
      platform: 'play',
      url: 'https://play.google.com/store/apps/details?id=im.adamant.adamantmessengerpwa&pli=1'
    }
  ],
  prefer_related_applications: true,
  shortcuts: [
    {
      name: 'Wallet',
      url: '/home',
      icons: [
        {
          src: '/img/icons/android-chrome-96x96.png',
          sizes: '96x96',
          type: 'image/png'
        }
      ]
    },
    {
      name: 'Chats',
      url: '/chats',
      icons: [
        {
          src: '/img/icons/android-chrome-96x96.png',
          sizes: '96x96',
          type: 'image/png'
        }
      ]
    },
    {
      name: 'Settings',
      url: '/options',
      icons: [
        {
          src: '/img/icons/android-chrome-96x96.png',
          sizes: '96x96',
          type: 'image/png'
        }
      ]
    }
  ],
  scope: 'https://msg.adamant.im',
  categories: ['finance', 'social', 'crypto', 'security', 'blockchain'],
  background_color: '#000000',
  theme_color: '#4DBA87'
}
