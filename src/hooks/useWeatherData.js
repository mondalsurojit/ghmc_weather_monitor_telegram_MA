import { useState, useEffect, useRef, useCallback } from 'react'
import { parseCSV } from '../utils/parseData'
import { checkThresholds } from '../utils/thresholds'

const STATION_DATA_URL = import.meta.env.VITE_STATION_DATA_URL   // /api/weather  (Vercel)
const SHEET_URL = import.meta.env.VITE_SHEET_URL           // Google Sheets CSV (localhost fallback)
const GHMC_MAP_URL = import.meta.env.VITE_GHMC_MAP_URL

const INTERVAL = 5 * 60 * 1000   // refresh every 5 minutes

// ── Fetch from best available source ─────────────────────────
async function fetchLiveWeather() {
  // Primary: /api/weather (Vercel) → returns JSON
  if (STATION_DATA_URL) {
    try {
      const r = await fetch(STATION_DATA_URL)
      if (r.ok) return await r.json()
    } catch (err) {
      console.warn('[fetchLiveWeather] Primary failed, falling back to CSV:', err.message)
    }
  }

  // Fallback: Google Sheets CSV (localhost)
  if (!SHEET_URL) throw new Error('No data source configured')
  const r = await fetch(SHEET_URL)
  if (!r.ok) throw new Error(`CSV fetch failed: HTTP ${r.status}`)
  return parseCSV(await r.text())
}

// ── Hook ──────────────────────────────────────────────────────
export function useWeatherData() {
  const [stations, setStations] = useState([])
  const [ghmcGeoJSON, setGhmcGeoJSON] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const timerRef = useRef(null)
  const metaRef = useRef({})   // client_id (string) → { District, Mandal, Location, latitude, longitude }

  // ── GHMC boundary (once) ─────────────────────────────────────
  const loadBoundary = useCallback(async () => {
    try {
      const r = await fetch(GHMC_MAP_URL)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setGhmcGeoJSON(await r.json())
    } catch (err) {
      console.warn('[useWeatherData] GHMC boundary failed:', err.message)
    }
  }, [])

  // ── Live weather merged with station metadata ─────────────────
  const loadStations = useCallback(async () => {
    try {
      setError(null)
      const liveRows = await fetchLiveWeather()
      const meta = metaRef.current

      const merged = liveRows
        .map(row => ({
          ...meta[String(row.client_id)],               // District, Mandal, Location, lat, lng
          ...row,                                        // rain, temp, humidity, wind, reading_time
          client_id: Number(row.client_id),
          rain: parseFloat(row.rain) || 0,
          temp: parseFloat(row.temp) || 0,
          humidity: parseFloat(row.humidity) || 0,
          wind: parseFloat(row.wind) || 0,
        }))
        .filter(s => s.latitude && s.longitude)

      setStations(merged)
      setAlerts(checkThresholds(merged))
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[useWeatherData] Station load failed:', err)
      setError('Could not load weather data. Retrying in 5 min…')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Init: load stations.json once, then start polling ────────
  useEffect(() => {
    const init = async () => {
      try {
        const r = await fetch('/stations.json')
        if (r.ok) {
          const list = await r.json()
          list.forEach(s => { metaRef.current[String(s.client_id)] = s })
        }
      } catch (err) {
        console.warn('[useWeatherData] stations.json failed:', err.message)
      }

      loadBoundary()
      loadStations()
      timerRef.current = setInterval(loadStations, INTERVAL)
    }

    init()
    return () => clearInterval(timerRef.current)
  }, [loadBoundary, loadStations])

  return { stations, ghmcGeoJSON, alerts, loading, error, lastUpdated, refresh: loadStations }
}