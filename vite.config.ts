import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import zipPack from 'vite-plugin-zip-pack'
import { APP_CONFIG } from './src/config/app'

declare const process: {
  env: Record<string, string | undefined>
}

function normalizeBase(prefix: string) {
  if (!prefix || prefix === '/') return '/'
  return `/${String(prefix).replace(/^\/+|\/+$/g, '')}/`
}

export default defineConfig({
  base: normalizeBase(process.env.VITE_BASE_PREFIX ?? APP_CONFIG.BASE_PREFIX),
  plugins: [
    react(),
    zipPack({
      inDir: 'dist',
      outDir: '.',
      outFileName: 'dist.zip'
    })
  ],
  server: {
    port: 3000
  }
})
