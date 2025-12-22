import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // Increase to 4MB
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'TreeRing Nail & Lash',
        short_name: 'TreeRing',
        description: '專業美甲與美睫服務，為您打造專屬的精緻美麗。',
        theme_color: '#ec4899', // 主要粉紅色
        background_color: '#fdf2f8', // 粉紅色系最淺色
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/192x192.png?alt=media&token=318122f9-9192-4893-89e0-7497346b8adb',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/512x512.png?alt=media&token=4772339c-c07c-4d9e-b391-81b78e710d61',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/512x512.png?alt=media&token=4772339c-c07c-4d9e-b391-81b78e710d61',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        // @ts-ignore
        gcm_sender_id: '103953800507',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // 將 /api 的請求代理到 Netlify functions 的本地開發伺服器 (port 8888)
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/.netlify/functions'),
      },
      // Proxy Firebase Auth requests to the Firebase Hosting URL
      '/__/auth': {
        target: 'https://nail-62ea4.firebaseapp.com',
        changeOrigin: true,
      },
    },
  },
})