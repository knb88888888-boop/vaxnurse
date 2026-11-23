import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pso2027CompleteData')) {
            return 'pso-complete-data';
          }
          if (id.includes('vaccinesCatalog')) {
            return 'vaccines-catalog-data';
          }
        }
      }
    }
  }
})
