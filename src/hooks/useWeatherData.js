import { useState, useEffect, useRef, useCallback } from 'react'
import { parseGISFile } from '../utils/parseData'
import { checkThresholds } from '../utils/thresholds'

const STATION_DATA_URL = import.meta.env.VITE_STATION_DATA_URL
const GHMC_MAP_URL = import.meta.env.VITE_GHMC_MAP_URL

const PROXIES = import.meta.env.VITE_PROXIES.split(',')

const INTERVAL = 10 * 60 * 1000   // refresh every 10 minutes

async function fetchViaProxy(url) {
  // Try proxies sequentially
  for (const proxy of PROXIES) {
    try {
      const r = await fetch(proxy + encodeURIComponent(url), { signal: AbortSignal.timeout(12000) })
      if (r.ok) {
        console.log('[fetchViaProxy] Proxy used:', proxy)
        return await r.text()
      }
    } catch (_) {}
  }

  throw new Error('All proxy attempts failed')
}

export function useWeatherData() {
  const [stations, setStations] = useState([])
  const [ghmcGeoJSON, setGhmcGeoJSON] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  // ── Load GHMC boundary (local GeoJSON) ──────────────────────
  const loadBoundary = useCallback(async () => {
    try {
      const r = await fetch(GHMC_MAP_URL)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const json = await r.json()
      setGhmcGeoJSON(json)
    } catch (err) {
      console.warn('[useWeatherData] GHMC boundary failed:', err.message)
    }
  }, [])

  // ── Load station data (via proxy) ───────────────────────────
  const loadStations = useCallback(async () => {
    try {
      setError(null)

      const text = await fetchViaProxy(STATION_DATA_URL)
      const json = parseGISFile(text)
      const list = json.features.map(f => f.properties)

      setStations(list)
      setAlerts(checkThresholds(list))
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[useWeatherData] Station load failed:', err)
      setError('Could not load weather data. Retrying in 5 min…')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Init ────────────────────────────────────────────────────
  useEffect(() => {
    loadBoundary()
    loadStations()

    timerRef.current = setInterval(loadStations, INTERVAL)

    return () => clearInterval(timerRef.current)
  }, [loadBoundary, loadStations])

  return { stations, ghmcGeoJSON, alerts, loading, error, lastUpdated, refresh: loadStations }
}