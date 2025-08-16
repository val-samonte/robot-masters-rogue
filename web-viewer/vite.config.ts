import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  server: {
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      'robot-masters-engine': '../wasm-wrapper/pkg/wasm_wrapper.js',
    },
  },
})
