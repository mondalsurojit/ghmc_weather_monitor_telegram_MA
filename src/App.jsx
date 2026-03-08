import { useState, useRef, useCallback } from 'react'
import MapView from './components/MapView'
import TopBar from './components/TopBar'
import MetricSwitcher from './components/MetricSwitcher'
import NotificationPanel from './components/NotificationPanel'
import { useTelegram } from './hooks/useTelegram'
import { useWeatherData } from './hooks/useWeatherData'

export default function App() {
  const [activeMetric,     setActiveMetric]     = useState('rain')
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedStation,  setSelectedStation]  = useState(null)
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
      className="h-screen w-screen overflow-hidden relative"
      style={{ background: '#080f1a' }}
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
          className="absolute inset-0 z-[2000] flex items-center justify-center"
          style={{ background: 'rgba(8,15,26,0.8)', backdropFilter: 'blur(6px)' }}
        >
          <div className="text-center">
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌦️</div>
            <div
              className="font-semibold mb-1"
              style={{ color: '#38bdf8', fontSize: 14, letterSpacing: '.04em', fontFamily: "'Space Grotesk', sans-serif" }}
            >
              GHMC WEATHER
            </div>
            <div style={{ fontSize: 11, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
              Fetching station data…
            </div>
            {/* Progress bar */}
            <div
              className="mt-4 mx-auto rounded-full overflow-hidden"
              style={{ width: 140, height: 2, background: 'rgba(56,189,248,0.12)' }}
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
          className="absolute bottom-28 left-3 right-3 z-[1500] rounded-2xl p-4 animate-fade-in"
          style={{
            background: 'rgba(69,10,10,0.9)',
            border: '1px solid rgba(239,68,68,0.3)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-start gap-3">
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#fca5a5' }}>Data fetch failed</div>
              <div style={{ fontSize: 11, color: '#991b1b', marginTop: 2 }}>{error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
