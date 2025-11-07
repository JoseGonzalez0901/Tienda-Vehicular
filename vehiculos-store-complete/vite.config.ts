import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// en DEV: sin base (base vacía). En BUILD: ya usas '/app/'.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: '/app', // URL real de tu API
        changeOrigin: true,
        secure: false, // porque es https con cert dev
      },
      '/uploads': {
        target: '/app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
