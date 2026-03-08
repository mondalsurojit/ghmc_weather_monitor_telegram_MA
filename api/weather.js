import { parseCSV } from '../src/utils/parseData.js'

export default async function handler(req, res) {
  const r = await fetch(import.meta.env.VITE_SHEET_URL)
  const data = parseCSV(await r.text())
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
  res.status(200).json(data)
}