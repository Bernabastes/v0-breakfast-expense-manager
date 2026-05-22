'use client'

import { useEffect } from 'react'

/** Ensures bot command menu is registered when dashboard loads (no manual sync). */
export function TelegramAutoSetup() {
  useEffect(() => {
    fetch('/api/telegram/setup', { credentials: 'include' }).catch(() => {})
  }, [])

  return null
}
