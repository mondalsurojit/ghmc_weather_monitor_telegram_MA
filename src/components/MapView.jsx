import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useMemo } from 'react'
import L from 'leaflet'
import { getMarkerColor, getMarkerRadius, getLegendStops } from '../utils/colors'
import { THRESHOLDS } from '../utils/thresholds'
import MapSettings from './MapSettings'

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const HYD_CENTER = [17.385, 78.4867]

// ── Popup HTML builder ────────────────────────────────────────
function buildPopupHTML(station, activeMetric) {
  const metrics = ['rain', 'temp', 'humidity', 'wind']
  const units = { rain: 'mm', temp: '°C', humidity: '%', wind: 'km/h' }
  const labels = { rain: 'RAIN', temp: 'TEMP', humidity: 'HUM', wind: 'WIND' }
  const colors = { rain: '#38bdf8', temp: '#fb923c', humidity: '#34d399', wind: '#a78bfa' }
  const bgs = { rain: '#0c1929', temp: '#180a03', humidity: '#011a12', wind: '#0d0522' }

  const valueRows = metrics.map(m => {
    const val = station[m]
    const fmt = val != null ? (m === 'temp' ? val.toFixed(1) : val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) : '—'
    const isActive = m === activeMetric
    return `
      <div style="
        background:${bgs[m]};
        border:1px solid ${isActive ? colors[m] + '60' : 'rgba(255,255,255,0.06)'};
        border-radius:10px; padding:8px 6px; text-align:center;
        ${isActive ? `box-shadow:0 0 10px ${colors[m]}30;` : ''}
      ">
        <div style="font-size:9px;font-weight:700;letter-spacing:.08em;color:${colors[m]};margin-bottom:4px;">${labels[m]}</div>
        <div style="font-size:16px;font-weight:700;color:#f1f5f9;font-family:'JetBrains Mono',monospace;line-height:1;">${fmt}</div>
        <div style="font-size:9px;color:rgba(241,245,249,0.4);margin-top:2px;">${units[m]}</div>
      </div>`
  }).join('')

  const alertStatus = (() => {
    for (const m of metrics) {
      const v = station[m]
      const t = THRESHOLDS[m]
      if (v != null && t) {
        if (t.severe && v >= t.severe) return { label: 'SEVERE', bg: '#450a0a', border: '#ef4444', dot: '#f87171' }
        if (t.warning && v >= t.warning) return { label: 'WARNING', bg: '#431407', border: '#f97316', dot: '#fb923c' }
      }
    }
    return null
  })()

  return `
    <div style="font-family:'Space Grotesk',sans-serif;background:#0d1929;padding:14px;min-width:210px;max-width:250px;">
      ${alertStatus ? `
        <div style="background:${alertStatus.bg};border:1px solid ${alertStatus.border}40;border-radius:6px;padding:4px 8px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
          <div style="width:6px;height:6px;border-radius:50%;background:${alertStatus.dot};flex-shrink:0;animation:pulse-glow 2s infinite;"></div>
          <span style="font-size:10px;font-weight:700;color:${alertStatus.dot};letter-spacing:.1em;">${alertStatus.label}</span>
        </div>` : ''}

      <div style="font-weight:700;font-size:13px;color:#f1f5f9;line-height:1.3;margin-bottom:2px;">
        ${(station.Location ?? '').trim()}
      </div>
      <div style="font-size:11px;color:#64748b;margin-bottom:12px;">
        ${station.Mandal ?? ''} &middot; ${station.District ?? ''}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
        ${valueRows}
      </div>

      <div style="font-size:9px;color:#334155;text-align:right;font-family:'JetBrains Mono',monospace;">
        ${station.reading_time ?? ''}
      </div>
    </div>
  `
}

// ── MapView Component ─────────────────────────────────────────
const MapView = forwardRef(function MapView(
  { stations, ghmcGeoJSON, activeMetric, selectedStation, onStationSelect },
  ref
) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [showBoundary, setShowBoundary] = useState(true)
  const [showStations, setShowStations] = useState(true)

  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef({})    // client_id → CircleMarker
  const ghmcLayerRef = useRef(null)
  const activeMetricRef = useRef(activeMetric)

  const legendStops = useMemo(() => getLegendStops(activeMetric), [activeMetric])

  // Expose flyTo to parent
  useImperativeHandle(ref, () => ({
    flyTo: (latlng, zoom = 15, opts = {}) => {
      mapRef.current?.flyTo(latlng, zoom, { duration: 1.2, ...opts })
    }
  }))

  // ── Init map (once) ─────────────────────────────────────────
  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: HYD_CENTER,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer(TILE_URL, {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    const zoomControl = L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Insert our map control button *inside* the zoom control stack (above '+')
    const zc = zoomControl.getContainer?.()
    if (zc) {
      const zoomIn = zc.querySelector('.leaflet-control-zoom-in')
      if (zoomIn) {
        const btn = document.createElement('button')
        btn.type = 'button'

        btn.setAttribute('aria-label', 'Map legend and controls')
        btn.className = 'ghmc-mapcontrol-btn'
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M4 21v-7" /><path d="M4 10V3" />
            <path d="M12 21v-9" /><path d="M12 8V3" />
            <path d="M20 21v-5" /><path d="M20 12V3" />
            <path d="M2 14h4" /><path d="M10 10h4" /><path d="M18 16h4" />
          </svg>
        `
        btn.onclick = (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          setPanelOpen(true)
        }

        btn.onmouseenter = () => {
          btn.style.background = 'rgba(14, 25, 45, 0.95)'
          btn.style.color = '#38bdf8'
        }
        btn.onmouseleave = () => {
          btn.style.background = 'rgba(8, 15, 26, 0.85)'
          btn.style.color = '#94a3b8'
        }

        // Make it behave like a Leaflet bar item spacing-wise
        btn.style.display = 'flex'
        btn.style.alignItems = 'center'
        btn.style.justifyContent = 'center'

        btn.style.width = '34px'
        btn.style.height = '34px'
        btn.style.background = 'rgba(8, 15, 26, 0.85)'
        btn.style.border = '1px solid rgba(148, 163, 184, 0.15)'
        btn.style.borderBottom = '1px solid rgba(148, 163, 184, 0.15)'
        btn.style.color = '#94a3b8'
        btn.style.backdropFilter = 'blur(8px)'
        btn.style.cursor = 'pointer'
        btn.style.borderTopLeftRadius = '4px'
        btn.style.borderTopRightRadius = '4px'
        btn.style.padding = '0'
        btn.style.outline = 'none'

        const svg = btn.querySelector('svg')
        if (svg) {
          svg.style.display = 'block'
          svg.style.pointerEvents = 'none'
        }

        zc.insertBefore(btn, zoomIn)
      }
    }

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // ── GHMC boundary layer ─────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return

    if (ghmcLayerRef.current) ghmcLayerRef.current.remove()

    if (!showBoundary || !ghmcGeoJSON) {
      ghmcLayerRef.current = null
      return
    }

    ghmcLayerRef.current = L.geoJSON(ghmcGeoJSON, {
      style: {
        color: '#38bdf8',
        weight: 1.5,
        opacity: 0.35,
        fillColor: '#38bdf8',
        fillOpacity: 0.03,
        dashArray: '4 6',
      }
    }).addTo(mapRef.current)
  }, [ghmcGeoJSON, showBoundary])

  // ── Station markers ─────────────────────────────────────────
  useEffect(() => {
    activeMetricRef.current = activeMetric

    if (!mapRef.current) return

    if (!showStations || stations.length === 0) {
      Object.values(markersRef.current).forEach(m => m.remove())
      markersRef.current = {}
      return
    }

    // Remove all existing markers
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}

    stations.forEach(station => {
      const lat = station.latitude
      const lng = station.longitude
      if (!lat || !lng) return

      const value = station[activeMetric]
      const color = getMarkerColor(activeMetric, value)
      const radius = getMarkerRadius(activeMetric, value)

      const marker = L.circleMarker([lat, lng], {
        radius,
        fillColor: color,
        color: 'rgba(255,255,255,0.15)',
        weight: 1,
        fillOpacity: 0.88,
        interactive: true,
      })

      const popup = L.popup({
        maxWidth: 270,
        minWidth: 210,
        className: 'ghmc-popup',
        closeButton: true,
        autoClose: true,
      })

      marker.on('click', () => {
        popup.setContent(buildPopupHTML(station, activeMetricRef.current))
        marker.bindPopup(popup).openPopup()
        onStationSelect(station)
      })

      marker.addTo(mapRef.current)
      markersRef.current[station.client_id] = marker
    })
  }, [stations, activeMetric, onStationSelect, showStations])

  // ── Fly to selected station ─────────────────────────────────
  useEffect(() => {
    if (!selectedStation || !mapRef.current) return
    const marker = markersRef.current[selectedStation.client_id]
    if (marker) {
      mapRef.current.flyTo(
        [selectedStation.latitude, selectedStation.longitude],
        15,
        { duration: 1.2 }
      )
      setTimeout(() => {
        const popup = L.popup({
          maxWidth: 270, minWidth: 210, className: 'ghmc-popup', closeButton: true
        })
        popup.setContent(buildPopupHTML(selectedStation, activeMetricRef.current))
        marker.bindPopup(popup).openPopup()
      }, 1300)
    }
  }, [selectedStation])

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      <MapSettings
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        activeMetric={activeMetric}
        legendStops={legendStops}
        showBoundary={showBoundary}
        setShowBoundary={setShowBoundary}
        showStations={showStations}
        setShowStations={setShowStations}
      />
    </div>
  )
})

export default MapView