import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // sockjs-client dùng biến global của Node — polyfill cho browser
    global: 'globalThis',
  },
})
