// ── Color stop definitions ────────────────────────────────────
// Each stop: { v: number (value), c: [R, G, B] }

const SCALES = {
  rain: [
    { v: 0,   c: [203, 213, 225] },  // slate-300  — dry
    { v: 2,   c: [125, 211, 252] },  // sky-300    — trace
    { v: 8,   c: [14,  165, 233] },  // sky-500    — light
    { v: 15,  c: [2,   132, 199] },  // sky-600    — moderate (warning)
    { v: 30,  c: [7,   89,  133] },  // sky-800    — heavy (severe)
  ],
  temp: [
    { v: 18,  c: [134, 239, 172] },  // green-300  — cool
    { v: 28,  c: [253, 224, 71]  },  // yellow-300 — warm
    { v: 35,  c: [251, 146, 60]  },  // orange-400 — hot
    { v: 40,  c: [239, 68,  68]  },  // red-500    — very hot (warning)
    { v: 45,  c: [127, 29,  29]  },  // red-900    — extreme (severe)
  ],
  humidity: [
    { v: 20,  c: [240, 253, 244] },  // green-50   — very dry
    { v: 50,  c: [110, 231, 183] },  // emerald-300
    { v: 75,  c: [16,  185, 129] },  // emerald-500
    { v: 88,  c: [4,   120, 87]  },  // emerald-700 — warning
    { v: 100, c: [2,   44,  34]  },  // emerald-950 — severe
  ],
  wind: [
    { v: 0,   c: [226, 232, 240] },  // slate-200  — calm
    { v: 15,  c: [196, 181, 253] },  // violet-300 — breeze
    { v: 30,  c: [139, 92,  246] },  // violet-500 — moderate (warning)
    { v: 50,  c: [109, 40,  217] },  // violet-700 — strong (severe)
    { v: 70,  c: [46,  16,  101] },  // violet-950 — dangerous
  ],
}

function interpolate(stops, value) {
  if (value <= stops[0].v)              return stops[0].c
  if (value >= stops[stops.length - 1].v) return stops[stops.length - 1].c

  for (let i = 0; i < stops.length - 1; i++) {
    const lo = stops[i], hi = stops[i + 1]
    if (value >= lo.v && value <= hi.v) {
      const t = (value - lo.v) / (hi.v - lo.v)
      return lo.c.map((ch, j) => Math.round(ch + t * (hi.c[j] - ch)))
    }
  }
  return stops[stops.length - 1].c
}

function toHex([r, g, b]) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

export function getMarkerColor(metric, value) {
  const stops = SCALES[metric]
  if (!stops || value == null || isNaN(value)) return '#475569'
  return toHex(interpolate(stops, value))
}

export function getMarkerRadius(metric, value) {
  if (metric === 'rain') return Math.min(5 + (value ?? 0) * 0.4, 16)
  if (metric === 'wind') return Math.min(5 + (value ?? 0) * 0.15, 14)
  return 7
}

export const METRIC_META = {
  rain:     { label: 'Rain',        unit: 'mm',   emoji: '🌧️', color: '#38bdf8', dimColor: '#0c4a6e' },
  temp:     { label: 'Temperature', unit: '°C',   emoji: '🌡️', color: '#fb923c', dimColor: '#431407' },
  humidity: { label: 'Humidity',    unit: '%',    emoji: '💧',  color: '#34d399', dimColor: '#064e3b' },
  wind:     { label: 'Wind Speed',  unit: 'km/h', emoji: '💨',  color: '#a78bfa', dimColor: '#2e1065' },
}
