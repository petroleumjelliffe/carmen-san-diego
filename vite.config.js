import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import yaml from '@modyfi/vite-plugin-yaml'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/carmen-san-diego/',
  plugins: [
    react(),
    yaml(),
    VitePWA({
      registerType: 'prompt', // User controls when to update
      includeAssets: ['backgrounds/*.jpg', 'backgrounds/*.png'],
      manifest: {
        name: 'Where in the World is The Shadow Syndicate?',
        short_name: 'Carmen San Diego',
        description: 'Track Carmen Sandiego and The Shadow Syndicate across the globe',
        start_url: '/carmen-san-diego/',
        scope: '/carmen-san-diego/',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,yaml}'],
        runtimeCaching: [
          // OpenStreetMap tiles
          {
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'openstreetmap-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Leaflet CSS from CDN
          {
            urlPattern: /^https:\/\/unpkg\.com\/leaflet.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'leaflet-cdn',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ]
})
