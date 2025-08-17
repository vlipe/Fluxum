import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
    // Adiciona a URL do Ngrok à lista de hosts permitidos
    host: true, // Isso permite que o servidor seja acessível na rede local
    allowedHosts: [
      '057b6b57fb42.ngrok-free.app', // Substitua por sua URL do Ngrok
    ],
  },
})
