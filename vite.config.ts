import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Force all imports to resolve to the same React instance
      react: path.resolve('./node_modules/react'),
    },
  },
})
