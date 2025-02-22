import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'masked-icon.svg',
        // Include all audio files with encoded names
        'themesong.mp3',
        'Dust of the Damned.mp3',
        'Grave of the Outcast.mp3',
        'Hustlers Last Run.mp3',
        'Junkies Jig.mp3',
        'Phantom Love.mp3',
        'Shadows in the Scrub.mp3',
        'Wraith of the Wastes.mp3',
        'siren.mp3'
      ],
      workbox: {
        // Configure workbox to handle audio files
        runtimeCaching: [{
          urlPattern: /\.mp3$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'audio-cache',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
            }
          }
        }]
      },
      manifest: {
        name: 'Bogan Hustler',
        short_name: 'Bogan Hustler',
        description: 'Build your underground empire in this Australian-themed trading game',
        theme_color: '#ff4500',
        start_url: './',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  base: process.env.GITHUB_PAGES === 'true' ? '/bogan_hustler/' : '/',
  assetsInclude: ['**/*.jpg', '**/*.png', '**/*.mp3']
})
