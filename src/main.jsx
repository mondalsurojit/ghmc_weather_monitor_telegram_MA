import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'

// ── Service Worker Registration ───────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      console.log('[App] SW registered, scope:', reg.scope)

      // Prevent infinite reload loop
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        console.log('[App] New SW activated — reloading app')
        window.location.reload()
      })

      // Notify SW of the current build version
      const sendVersion = (sw) => {
        sw.postMessage({ type: 'GET_VERSION' })
      }

      if (reg.active) sendVersion(reg.active)

      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing
        if (newSW) {
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[App] New SW version available — activating soon')
            }
          })
        }
      })

    } catch (err) {
      console.warn('[App] SW registration failed:', err)
    }
  })
}

// ── Mount App ─────────────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)