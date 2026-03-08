export const THRESHOLDS = {
  rain:     { warning: 10,  severe: 15  },   // mm/hr
  temp:     { warning: 38,  severe: 42  },   // °C
  humidity: { warning: 85,  severe: 95  },   // %
  wind:     { warning: 30,  severe: 50  },   // km/h
}

export function checkThresholds(stations) {
  const alerts = []

  stations.forEach(station => {
    Object.entries(THRESHOLDS).forEach(([metric, thresh]) => {
      const value = station[metric]
      if (value == null || isNaN(value)) return

      if (thresh.severe != null && value >= thresh.severe) {
        alerts.push({ level: 'SEVERE', metric, value, station })
      } else if (thresh.warning != null && value >= thresh.warning) {
        alerts.push({ level: 'WARNING', metric, value, station })
      }
    })
  })

  // SEVERE first, then by value descending within each level
  return alerts.sort((a, b) => {
    if (a.level !== b.level) return a.level === 'SEVERE' ? -1 : 1
    return b.value - a.value
  })
}
