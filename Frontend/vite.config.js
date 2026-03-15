import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    port: 3010,
    host: true,
  },
  server: {
    host: true,
    port: 3010,
    allowedHosts: ['cod-data.com', 'www.cod-data.com'],
    proxy: { '/api': 'http://localhost:5010' },
  },
})
