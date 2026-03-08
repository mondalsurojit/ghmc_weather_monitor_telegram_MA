import { useEffect, useRef } from 'react'

export function useTelegram() {
  const tgRef = useRef(window.Telegram?.WebApp ?? null)

  useEffect(() => {
    const tg = tgRef.current
    if (!tg) return

    // Signal the Telegram client that the app is ready
    tg.ready()

    // Expand to full-screen (removes the collapse handle)
    tg.expand()

    // Lock to portrait
    tg.lockOrientation?.()

    // Match header/bg to our dark theme
    try {
      tg.setHeaderColor('#080f1a')
      tg.setBackgroundColor('#080f1a')
    } catch (_) {
      // Older SDK versions may not support setHeaderColor
    }

    // Enable closing confirmation if user swipes down
    tg.enableClosingConfirmation?.()
  }, [])

  return {
    tg: tgRef.current,
    isInsideTelegram: !!tgRef.current,
    colorScheme: tgRef.current?.colorScheme ?? 'dark',
    user: tgRef.current?.initDataUnsafe?.user ?? null,
  }
}
