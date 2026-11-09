import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // /api so'rovlari Python backendga yo'naltiriladi
    proxy: { '/api': process.env.API_URL || 'http://localhost:8000' },
  },
})
