import { parseCSV } from '../src/utils/parseData.js'

export default async function handler(req, res) {
  const sheetUrl = process.env.SHEET_URL || process.env.VITE_SHEET_URL
  if (!sheetUrl) {
    res.status(500).json({ error: 'Missing SHEET_URL env var' })
    return
  }

  const r = await fetch(sheetUrl)
  if (!r.ok) {
    res.status(502).json({ error: `Upstream CSV fetch failed: HTTP ${r.status}` })
    return
  }

  const data = parseCSV(await r.text())
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
  res.status(200).json(data)
}