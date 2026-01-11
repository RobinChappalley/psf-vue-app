import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'
//import tailwindcss from '@tailwindcss/vite'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate', // Met à jour l'app dès qu'une modif est détectée
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Pieds sans Frontières',
        short_name: 'PSF',
        description: 'Application mobile de Pieds sans Frontières',
        theme_color: '#000000',
        icons: [
          {
            src: 'pwa-192x192.png', // Tu devras créer cette image
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png', // Et celle-ci
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        importScripts: ['push-sw.js'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    hmr: {
      clientPort: 5173,
    },
    watch: {
      usePolling: true,
    },
  },
})
