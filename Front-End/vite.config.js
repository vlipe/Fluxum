// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
  host: true,
  allowedHosts: ['6a73e3da332ed.ngrok-free.app'], // se estiver usando ngrok
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/ws':  { target: 'ws://localhost:3000', ws: true },
  }
}

})
