import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    root: __dirname,
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(__dirname, 'vitest.setup.js')],
  },
})
