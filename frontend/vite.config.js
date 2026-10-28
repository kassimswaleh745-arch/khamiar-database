import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const api = { '/api': { target: 'http://localhost:8080', changeOrigin: false } }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { host: true, proxy: api },   // host: true = simu za mtandao mmoja zinaweza kufungua
  preview: { host: true, proxy: api },
})
