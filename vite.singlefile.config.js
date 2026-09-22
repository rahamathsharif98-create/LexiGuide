import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'
import { viteSingleFile } from 'vite-plugin-singlefile'

// This build produces a single, self-contained, CLASSIC (non-module) HTML
// file so it also works when opened directly via file:// in a browser —
// browsers block <script type="module"> from loading over file:// due to
// CORS, so we render legacy-only output here instead of the modern build
// used by `npm run build` for real hosting.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ['defaults', 'not IE 11'],
      modernPolyfills: true,
      renderModernChunks: false,
    }),
    viteSingleFile(),
  ],
  build: {
    outDir: 'dist-preview',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    target: 'es2015',
  },
})
