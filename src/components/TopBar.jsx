import { useState, useEffect, useRef } from 'react'

export default function TopBar({ stations, alerts, onStationSelect, onBellClick, lastUpdated, loading }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const wrapRef = useRef(null)

  // Filter stations as user types
  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    const q = query.toLowerCase()
    const hits = stations
      .filter(s =>
        (s.Location ?? '').toLowerCase().includes(q) ||
        (s.Mandal ?? '').toLowerCase().includes(q) ||
        (s.District ?? '').toLowerCase().includes(q)
      )
      .slice(0, 7)
    setResults(hits)
    setOpen(hits.length > 0)
  }, [query, stations])

  // Close dropdown on outside tap
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [])

  function handleSelect(station) {
    setQuery((station.Location ?? '').trim())
    setOpen(false)
    inputRef.current?.blur()
    onStationSelect(station)
  }

  function clearSearch() {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  const severeCount = alerts.filter(a => a.level === 'SEVERE').length
  const warningCount = alerts.filter(a => a.level === 'WARNING').length
  const alertCount = alerts.length
  const badgeColor = severeCount > 0 ? '#ef4444' : warningCount > 0 ? '#f97316' : null

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : null

  return (
    <div
      className="absolute top-0 left-0 right-0 z-[1000]"
      style={{
        paddingTop: 'env(safe-area-inset-top, 12px)',
        background: 'linear-gradient(to bottom, #080f1af2 0%, #080f1ab3, 0.70) 80%, transparent 100%)',
      }}
    >
      <div className="px-3 pt-3 pb-4 flex items-center gap-2">

        {/* ── Search bar ─────────────────────────────────── */}
        <div ref={wrapRef} className="relative flex-1">
          <div
            className={
              "flex items-center gap-2 px-3.5 h-10 rounded-2xl " +
              "bg-slate-900/90 backdrop-blur-[12px] " +
              "border border-sky-400/15 " +
              "transition-shadow duration-150"
            }
            style={{
              boxShadow: open ? '0 0 0 1.5px #38bdf84d' : 'none',
            }}
          >
            {/* Search icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              placeholder="Search station, mandal…"
              className="flex-1 bg-transparent outline-none text-sm text-slate-200 caret-sky-400"
            />

            {/* Loading spinner or clear */}
            {loading && !query ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
              </svg>
            ) : query ? (
              <button
                onPointerDown={clearSearch}
                className="text-slate-600 leading-none text-lg px-[2px]"
              >
                ×
              </button>
            ) : null}
          </div>

          {/* ── Dropdown results ─────────────────────────── */}
          {open && (
            <div
              className={
                "search-dropdown absolute top-12 left-0 right-0 rounded-2xl overflow-hidden shadow-2xl " +
                "bg-slate-950/95 backdrop-blur-[16px] " +
                "border border-sky-400/15 " +
                "max-h-[55vw] overflow-y-auto z-50"
              }
            >
              {results.map((s, i) => (
                <button
                  key={s.client_id}
                  onPointerDown={() => handleSelect(s)}
                  className={
                    "w-full text-left px-4 py-3 flex items-center gap-3 " +
                    (i < results.length - 1 ? "border-b border-white/5" : "border-b-0")
                  }
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 opacity-70"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate text-slate-200">
                      {(s.Location ?? '').trim()}
                    </div>
                    <div className="text-xs truncate text-slate-600">
                      {s.Mandal} · {s.District}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Bell button ──────────────────────────────────── */}
        <button
          onClick={onBellClick}
          className="relative flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-900/90 backdrop-blur-[12px] border"
          style={{
            borderColor: badgeColor ? badgeColor + '50' : '#38bdf826',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke={badgeColor ?? '#64748b'} strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {alertCount > 0 && (
            <span
              className="animate-pulse-glow absolute flex items-center justify-center font-bold -top-1 -right-1 min-w-[18px] h-[18px] rounded-lg text-white text-[8px] px-1 font-mono border-2 border-slate-950"
              style={{
                background: badgeColor,
              }}
            >
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Status bar ─────────────────────────────────────────── */}
      {timeStr && !loading && (
        <div
          className="mx-3 mb-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 backdrop-blur-[8px] border border-white/5"
        >
          <div className="animate-pulse-glow w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
          <span className="text-[8px] text-slate-600 font-mono tracking-wider">
            {stations.length} STATIONS · {timeStr}
          </span>
          {alertCount > 0 && (
            <span className="text-[8px] font-mono tracking-wider ml-auto" style={{ color: badgeColor }}>
              {severeCount > 0 ? `🚨 ${severeCount} SEVERE` : ''}{severeCount > 0 && warningCount > 0 ? '  ' : ''}{warningCount > 0 ? `⚠️ ${warningCount} WARNING` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
