import { useEffect, useRef } from 'react'
import { METRIC_META } from '../utils/colors'
import { Bell } from 'lucide-react'

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
        background: isSevere ? '#450a0a80' : '#43140780, 0.50)',
        border: `1px solid ${isSevere ? '#ef444440' : '#f973164025)'}`,
      }}
    >
      {/* Status dot */}
      <div
        className={
          "flex-shrink-0 animate-pulse-glow w-2 h-2 rounded-full " +
          (isSevere ? "bg-red-500" : "bg-orange-500")
        }
      />

      {/* Station info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate text-slate-100">
          {(alert.station.Location ?? '').trim()}
        </div>
        <div className="text-xs truncate text-slate-600">
          {alert.station.Mandal} · {alert.station.District}
        </div>
      </div>

      {/* Metric badge */}
      <div
        className="flex-shrink-0 flex flex-col items-center rounded-lg px-2.5 py-1.5 min-w-[54px]"
        style={{ background: meta.dimColor }}
      >
        <span className="text-[10px] mb-px">{meta.emoji}</span>
        <span
          className="text-sm font-bold font-mono leading-none"
          style={{ color: meta.color }}
        >
          {val}
        </span>
        <span className="text-[8px] mt-px" style={{ color: meta.color + '80' }}>{meta.unit}</span>
      </div>
    </div>
  )
}

export default function NotificationPanel({ alerts, lastUpdated, onClose }) {
  const sheetRef = useRef(null)
  const severe = alerts.filter(a => a.level === 'SEVERE')
  const warning = alerts.filter(a => a.level === 'WARNING')

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
      className="absolute inset-0 z-40 flex flex-col justify-end bg-black/55 backdrop-blur-[6px]"
      onPointerDown={handleBackdrop}
    >
      <div
        ref={sheetRef}
        className="animate-slide-up rounded-t-3xl overflow-hidden flex flex-col bg-slate-950 border border-sky-400/10 border-b-0 max-h-[82vh]"
        style={{
          boxShadow: '0 -20px 60px #00000080',
        }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-sm bg-white/10" />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-white/5"
        >
          <div>
            <h2 className="font-bold text-base text-slate-100 font-display">
              Weather Alerts
            </h2>
            <p className="text-xs text-slate-700 font-mono mt-0.5">
              Updated {timeStr}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {severe.length > 0 && (
              <span
                className="animate-pulse-glow flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs bg-red-500/15 border border-red-500/30 text-red-300"
              >
                🚨 {severe.length}
              </span>
            )}
            {warning.length > 0 && (
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs bg-orange-500/15 border border-orange-500/30 text-orange-300"
              >
                ⚠️ {warning.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-slate-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Bell size={40} strokeWidth={1.5} className="mb-3 text-slate-600" />
              <p className="font-semibold text-sm text-slate-600">All clear — no active alerts</p>
              <p className="text-xs text-slate-700 mt-1">All stations within normal thresholds</p>
            </div>
          ) : (
            <div className="space-y-3">
              {severe.length > 0 && (
                <section>
                  <div
                      className="flex items-center gap-2 mb-2 text-[10px] font-bold tracking-widest text-red-500 uppercase font-mono"
                  >
                    <span>🚨 Severe Alerts</span>
                    <span className="bg-red-500/20 px-[7px] py-[1px] rounded-full">{severe.length}</span>
                  </div>
                  <div className="space-y-2">
                    {severe.map((a, i) => <AlertCard key={i} alert={a} />)}
                  </div>
                </section>
              )}

              {severe.length > 0 && warning.length > 0 && (
                <div className="h-px bg-white/5 my-2" />
              )}

              {warning.length > 0 && (
                <section>
                  <div
                      className="flex items-center gap-2 mb-2 text-[10px] font-bold tracking-widest text-orange-500 uppercase font-mono"
                  >
                    <span>⚠️ Warnings</span>
                    <span className="bg-orange-500/20 px-[7px] py-[1px] rounded-full">{warning.length}</span>
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
        <div className="flex-shrink-0" style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>
    </div>
  )
}
