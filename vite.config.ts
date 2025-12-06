import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // This ensures that the generated file paths are relative,
    // making it easy to host the build output in any directory.
    assetsDir: 'assets',
  }
})
