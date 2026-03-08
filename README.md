# GHMC Weather Monitor — Telegram Mini App

Real-time weather monitoring for 150+ stations across Greater Hyderabad (GHMC).
Built with React + Vite + TailwindCSS + Leaflet.js + Telegram Mini App SDK.

---

## Features
- 🗺  Full-screen Leaflet map with GHMC circle boundaries
- 📡  Live data from Telangana govt — auto-refreshes every 5 minutes
- 🎨  4 metric layers: Rain · Temperature · Humidity · Wind
- 🔔  Real-time threshold alerts with severity levels
- 🔍  Station search (by name, mandal, or district)
- 💬  Telegram Mini App SDK integrated (theme sync, expand, ready)
- 📦  Service Worker with auto-versioned cache (works offline after first load)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Dev server
```bash
npm run dev
```

### 3. Production build
```bash
npm run build
```
> The build automatically stamps the current timestamp into `public/sw.js`  
> — old caches are invalidated on every deploy with no manual work.

### 4. Deploy
Upload the `dist/` folder to **Cloudflare Pages**, **Netlify**, or **Vercel**.

---

## Telegram Mini App Registration

1. Open **@BotFather** → your bot → **Menu Button** → set URL to your deployed domain
2. Or send an Inline Button with `web_app: { url: "https://your-app.pages.dev" }`

---

## CORS Note

The Telangana government server blocks most foreign IPs. The app tries:
1. Direct fetch (works if accessed from India)
2. `api.allorigins.win` proxy
3. `corsproxy.io` proxy

If all three fail in your environment, replace with:
- Your own Cloudflare Worker proxy
- ScraperAPI (already configured in your GAS script)
- A GAS `doGet()` Web App endpoint reading from the sheet

See `src/hooks/useWeatherData.js` → `fetchViaProxy()` to swap the proxy.

---

## Threshold Defaults (editable in `src/utils/thresholds.js`)

| Metric   | Warning | Severe |
|----------|---------|--------|
| Rain     | 10 mm   | 15 mm  |
| Temp     | 38 °C   | 42 °C  |
| Humidity | 85 %    | 95 %   |
| Wind     | 30 km/h | 50 km/h|

---

## Service Worker Versioning

- `CACHE_VERSION` in `public/sw.js` is auto-stamped on every `npm run build`
- Old caches are deleted on SW `activate`
- To force a cache bust manually: bump the version string in `public/sw.js` before deploying
