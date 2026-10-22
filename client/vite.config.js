import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'react-vendor';
          if (id.includes('node_modules/@reduxjs') || id.includes('node_modules/react-redux')) return 'redux-vendor';
          if (id.includes('node_modules/motion')) return 'motion';
          if (id.includes('node_modules/@monaco-editor')) return 'monaco';
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase';
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
