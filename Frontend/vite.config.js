import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    port: 3010,
    host: true,
    // Match dev: if anything proxies to preview:3010, /api still reaches the backend.
    proxy: { '/api': 'http://localhost:5010' },
  },
  server: {
    host: true,
    port: 3010,
    allowedHosts: ['cod-data.com', 'www.cod-data.com'],
    proxy: { '/api': 'http://localhost:5010' },
  },
})
