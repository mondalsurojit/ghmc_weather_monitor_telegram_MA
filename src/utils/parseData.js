export function parseCSV(text) {
  const rows    = text.trim().split('\n').map(r => r.trim()).filter(Boolean)
  const headers = rows[0].split(',').map(h => h.trim())
  return rows.slice(1).map(row => {
    const vals = row.split(',')
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() ?? '']))
  })
}