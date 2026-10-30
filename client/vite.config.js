import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' so the built site also works when it's hosted in a sub-folder
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    // In development the browser talks to localhost:5173 only. Anything starting with /api is
    // forwarded to the Express server on :4000. Same trick as vercel.json does in production.
    proxy: { '/api': 'http://localhost:4000' },
  },
})
