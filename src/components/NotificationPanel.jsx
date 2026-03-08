import { useEffect, useRef } from 'react'
import { METRIC_META } from '../utils/colors'

function AlertCard({ alert }) {
  const meta = METRIC_META[alert.metric] ?? { label: alert.metric, unit: '', emoji: '📊', color: '#94a3b8', dimColor: '#1e293b' }
  const isSevere = alert.level === 'SEVERE'
  const val = typeof alert.value === 'number'
    ? (alert.value % 1 === 0 ? alert.value.toFixed(0) : alert.value.toFixed(1))
    : alert.value

  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3"
      style={{
        background: isSevere ? 'rgba(69,10,10,0.5)' : 'rgba(67,20,7,0.5)',
        border: `1px solid ${isSevere ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.25)'}`,
      }}
    >
      {/* Status dot */}
      <div
        className="flex-shrink-0 animate-pulse-glow"
        style={{
          width: 8, height: 8, borderRadius: '50%',
          background: isSevere ? '#ef4444' : '#f97316',
        }}
      />

      {/* Station info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: '#f1f5f9' }}>
          {(alert.station.Location ?? '').trim()}
        </div>
        <div className="text-xs truncate" style={{ color: '#475569' }}>
          {alert.station.Mandal} · {alert.station.District}
        </div>
      </div>

      {/* Metric badge */}
      <div
        className="flex-shrink-0 flex flex-col items-center rounded-lg px-2.5 py-1.5"
        style={{ background: meta.dimColor, minWidth: 54 }}
      >
        <span style={{ fontSize: 10, marginBottom: 1 }}>{meta.emoji}</span>
        <span
          style={{
            fontSize: 13, fontWeight: 700,
            color: meta.color,
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1,
          }}
        >
          {val}
        </span>
        <span style={{ fontSize: 8, color: meta.color + '80', marginTop: 1 }}>{meta.unit}</span>
      </div>
    </div>
  )
}

export default function NotificationPanel({ alerts, lastUpdated, onClose }) {
  const sheetRef = useRef(null)
  const severe   = alerts.filter(a => a.level === 'SEVERE')
  const warning  = alerts.filter(a => a.level === 'WARNING')

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit', minute: '2-digit',
        day: '2-digit', month: 'short',
        hour12: true,
      })
    : '—'

  // Close on backdrop tap
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  // Prevent scroll bleed
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="absolute inset-0 z-[3000] flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onPointerDown={handleBackdrop}
    >
      <div
        ref={sheetRef}
        className="animate-slide-up rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          background: '#080f1a',
          border: '1px solid rgba(56,189,248,0.1)',
          borderBottom: 'none',
          maxHeight: '82vh',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
        }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h2 className="font-bold text-base" style={{ color: '#f1f5f9', fontFamily: "'Space Grotesk', sans-serif" }}>
              Weather Alerts
            </h2>
            <p style={{ fontSize: 11, color: '#334155', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
              Updated {timeStr}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {severe.length > 0 && (
              <span
                className="animate-pulse-glow flex items-center gap-1 px-2.5 py-1 rounded-full font-bold"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 11 }}
              >
                🚨 {severe.length}
              </span>
            )}
            {warning.length > 0 && (
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold"
                style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c', fontSize: 11 }}
              >
                ⚠️ {warning.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#475569', fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div style={{ fontSize: 42, marginBottom: 12 }}>✅</div>
              <p className="font-semibold text-sm" style={{ color: '#475569' }}>All clear — no active alerts</p>
              <p style={{ fontSize: 11, color: '#1e293b', marginTop: 4 }}>All stations within normal thresholds</p>
            </div>
          ) : (
            <div className="space-y-3">
              {severe.length > 0 && (
                <section>
                  <div
                    className="flex items-center gap-2 mb-2"
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: '#ef4444', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <span>🚨 Severe Alerts</span>
                    <span style={{ background: 'rgba(239,68,68,0.2)', padding: '1px 7px', borderRadius: 99 }}>{severe.length}</span>
                  </div>
                  <div className="space-y-2">
                    {severe.map((a, i) => <AlertCard key={i} alert={a} />)}
                  </div>
                </section>
              )}

              {severe.length > 0 && warning.length > 0 && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
              )}

              {warning.length > 0 && (
                <section>
                  <div
                    className="flex items-center gap-2 mb-2"
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: '#f97316', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <span>⚠️ Warnings</span>
                    <span style={{ background: 'rgba(249,115,22,0.2)', padding: '1px 7px', borderRadius: 99 }}>{warning.length}</span>
                  </div>
                  <div className="space-y-2">
                    {warning.map((a, i) => <AlertCard key={i} alert={a} />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Bottom safe area spacer */}
        <div style={{ height: 'env(safe-area-inset-bottom, 12px)', flexShrink: 0 }} />
      </div>
    </div>
  )
}
