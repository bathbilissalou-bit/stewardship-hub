import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory'))
              return 'vendor-charts'
            if (id.includes('jspdf') || id.includes('html2canvas'))
              return 'vendor-pdf'
            if (id.includes('html5-qrcode'))
              return 'vendor-qr'
            if (id.includes('xlsx'))
              return 'vendor-xlsx'
            if (id.includes('@supabase'))
              return 'vendor-supabase'
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/'))
              return 'vendor-react'
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
