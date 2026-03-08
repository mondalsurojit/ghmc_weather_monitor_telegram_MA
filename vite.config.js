import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const buildVersion = `v${new Date().toISOString().slice(0, 10)}-${Date.now()}`

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-sw-version',
      buildStart() {
        // Auto-stamp the SW cache version on every build
        const swPath = path.resolve(__dirname, 'public/sw.js')
        let sw = fs.readFileSync(swPath, 'utf-8')
        sw = sw.replace(/const CACHE_VERSION = '[^']*'/, `const CACHE_VERSION = '${buildVersion}'`)
        fs.writeFileSync(swPath, sw)
        console.log(`[sw-version] Stamped ${buildVersion}`)
      }
    }
  ],
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion)
  }
})
