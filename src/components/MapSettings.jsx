import { useEffect, useRef } from 'react'
import { METRIC_META } from '../utils/colors'

export default function MapSettings({ open, onClose, activeMetric, legendStops, showBoundary,
  setShowBoundary, showStations, setShowStations }) {
  const sheetRef = useRef(null)

  // Close on backdrop tap
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  // Prevent scroll bleed
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="absolute inset-0 z-[9999] flex flex-col justify-end bg-black/55 backdrop-blur-[6px]"
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
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-sm bg-white/10" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-white/5">
          <div>
            <h2 className="font-bold text-base text-slate-100 font-display">
              Map Legend
            </h2>
            <p className="text-xs text-slate-700 font-mono mt-0.5">
              {METRIC_META[activeMetric]?.label ?? activeMetric}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-slate-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-2">
            {legendStops.map((s) => (
              <div key={s.value} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <div className="text-[11px] font-mono text-slate-400">
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/5 my-4" />

          <button
            type="button"
            onClick={() => setShowBoundary(v => !v)}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="text-sm text-slate-200">GHMC Boundary</span>
            <span
              className={
                "w-9 h-5 rounded-full border transition-colors " +
                (showBoundary ? "bg-sky-400/25 border-sky-400/30" : "bg-white/5 border-white/10")
              }
            >
              <span
                className={
                  "block w-4 h-4 rounded-full mt-[2px] transition-transform " +
                  (showBoundary ? "translate-x-[18px] bg-sky-400" : "translate-x-[2px] bg-slate-500")
                }
              />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowStations(v => !v)}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="text-sm text-slate-200">Stations</span>
            <span
              className={
                "w-9 h-5 rounded-full border transition-colors " +
                (showStations ? "bg-sky-400/25 border-sky-400/30" : "bg-white/5 border-white/10")
              }
            >
              <span
                className={
                  "block w-4 h-4 rounded-full mt-[2px] transition-transform " +
                  (showStations ? "translate-x-[18px] bg-sky-400" : "translate-x-[2px] bg-slate-500")
                }
              />
            </span>
          </button>
        </div>

        <div className="flex-shrink-0" style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>
    </div>
  )
}
