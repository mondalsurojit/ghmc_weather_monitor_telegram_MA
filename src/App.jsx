import { useState, useRef, useCallback } from 'react'
import MapView from './components/MapView'
import TopBar from './components/TopBar'
import MetricSwitcher from './components/MetricSwitcher'
import NotificationPanel from './components/NotificationPanel'
import { useTelegram } from './hooks/useTelegram'
import { useWeatherData } from './hooks/useWeatherData'

export default function App() {
  const [activeMetric, setActiveMetric] = useState('rain')
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedStation, setSelectedStation] = useState(null)
  const mapRef = useRef(null)

  // Telegram SDK init
  useTelegram()

  // Live weather data + GHMC boundary
  const { stations, ghmcGeoJSON, alerts, loading, error, lastUpdated } = useWeatherData()

  // When user picks a station from search, fly map there
  const handleStationSelect = useCallback((station) => {
    setSelectedStation(station)
    mapRef.current?.flyTo([station.latitude, station.longitude], 15)
  }, [])

  return (
    <div
      className="h-screen w-screen overflow-hidden relative bg-slate-950"
    >
      {/* ── Full-screen map ──────────────────────────────── */}
      <MapView
        ref={mapRef}
        stations={stations}
        ghmcGeoJSON={ghmcGeoJSON}
        activeMetric={activeMetric}
        selectedStation={selectedStation}
        onStationSelect={setSelectedStation}
      />

      {/* ── Top bar (search + bell + status) ────────────── */}
      <TopBar
        stations={stations}
        alerts={alerts}
        onStationSelect={handleStationSelect}
        onBellClick={() => setShowNotifications(true)}
        lastUpdated={lastUpdated}
        loading={loading}
      />

      {/* ── Bottom metric switcher ───────────────────────── */}
      <MetricSwitcher
        activeMetric={activeMetric}
        onChange={setActiveMetric}
        stations={stations}
      />

      {/* ── Notification bottom sheet ────────────────────── */}
      {showNotifications && (
        <NotificationPanel
          alerts={alerts}
          lastUpdated={lastUpdated}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* ── Loading overlay ──────────────────────────────── */}
      {loading && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-[6px]"
        >
          <div className="text-center">
            <div className="text-[40px] mb-3">🌦️</div>
            <div className="font-semibold mb-1 text-sky-400 text-sm tracking-wider font-display">
              GHMC WEATHER
            </div>
            <div className="text-xs text-slate-600 font-mono">
              Fetching station data…
            </div>
            {/* Progress bar */}
            <div
              className="mt-4 mx-auto rounded-full overflow-hidden w-[140px] h-0.5 bg-sky-400/10"
            >
              <div
                className="h-full rounded-full animate-pulse-glow"
                style={{ width: '60%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Error toast ──────────────────────────────────── */}
      {error && !loading && stations.length === 0 && (
        <div
          className="absolute bottom-28 left-3 right-3 z-20 rounded-2xl p-4 animate-fade-in bg-red-950/90 border border-red-500/30 backdrop-blur-[8px]"
        >
          <div className="flex items-start gap-3">
            <span className="text-base shrink-0">⚠️</span>
            <div>
              <div className="font-semibold text-sm text-red-300">Data fetch failed</div>
              <div className="text-xs text-red-800 mt-0.5">{error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
