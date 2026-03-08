import { useMemo } from 'react'
import { METRIC_META } from '../utils/colors'

const METRICS = [
  { key: 'rain',     ...METRIC_META.rain     },
  { key: 'temp',     ...METRIC_META.temp     },
  { key: 'humidity', ...METRIC_META.humidity },
  { key: 'wind',     ...METRIC_META.wind     },
]

export default function MetricSwitcher({ activeMetric, onChange, stations }) {
  // Compute stats per metric
  const stats = useMemo(() => {
    if (!stations.length) return {}
    const out = {}
    METRICS.forEach(({ key, unit }) => {
      const vals = stations.map(s => s[key]).filter(v => v != null && !isNaN(v))
      if (!vals.length) { out[key] = { avg: '—', max: '—', unit }; return }
      const avg = (vals.reduce((a, b) => a + b, 0) / vals.length)
      const max = Math.max(...vals)
      out[key] = {
        avg: avg % 1 === 0 ? avg.toFixed(0) : avg.toFixed(1),
        max: max % 1 === 0 ? max.toFixed(0) : max.toFixed(1),
        unit,
      }
    })
    return out
  }, [stations])

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-[1000]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 12px)',
        background: 'linear-gradient(to top, rgba(8,15,26,1) 0%, rgba(8,15,26,0.85) 70%, transparent 100%)',
      }}
    >
      <div className="flex gap-2 px-3 pt-3 pb-3">
        {METRICS.map(m => {
          const isActive = activeMetric === m.key
          const stat     = stats[m.key]

          return (
            <button
              key={m.key}
              onClick={() => onChange(m.key)}
              className="flex-1 flex flex-col items-center rounded-2xl py-2.5 transition-all duration-200"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${m.dimColor}, ${m.color}22)`
                  : 'rgba(12, 20, 38, 0.7)',
                border: `1px solid ${isActive ? m.color + '55' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: isActive ? `0 0 20px ${m.color}20, inset 0 1px 0 ${m.color}20` : 'none',
                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {/* Emoji icon */}
              <span style={{ fontSize: 18, lineHeight: 1, marginBottom: 4 }}>{m.emoji}</span>

              {/* Label */}
              <span
                className="font-semibold tracking-wide"
                style={{
                  fontSize: 9.5,
                  letterSpacing: '.06em',
                  color: isActive ? m.color : '#475569',
                  textTransform: 'uppercase',
                  marginBottom: 3,
                }}
              >
                {m.label}
              </span>

              {/* Avg value */}
              {stat && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isActive ? '#f1f5f9' : '#334155',
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1,
                  }}
                >
                  {stat.avg}
                  <span style={{ fontSize: 8, fontWeight: 400, marginLeft: 1 }}>{stat.unit}</span>
                </span>
              )}

              {/* Active indicator dot */}
              {isActive && (
                <div
                  className="mt-1.5 animate-pulse-glow"
                  style={{ width: 4, height: 4, borderRadius: '50%', background: m.color }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
