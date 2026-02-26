import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // basicSsl() // Disable SSL for local testing to avoid mixed content issues
  ],
  server: {
    host: '0.0.0.0', // Expose to network
    port: 5173,
    https: false      // Disable HTTPS
  }
})
