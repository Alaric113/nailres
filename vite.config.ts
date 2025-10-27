import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import {VitePWA} from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
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
            src: 'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/192x192.jpg?alt=media&token=c3dea845-f717-4300-b5ab-90286a50f248',
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
    },
  },
})