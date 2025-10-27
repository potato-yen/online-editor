import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev server config
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
