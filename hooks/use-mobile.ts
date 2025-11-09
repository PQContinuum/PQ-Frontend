import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

const getMatches = () => {
  if (typeof window === "undefined") {
    return false
  }
  return window.matchMedia(MEDIA_QUERY).matches
}

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => {}
  }

  const mediaQuery = window.matchMedia(MEDIA_QUERY)
  const handler = () => callback()

  mediaQuery.addEventListener("change", handler)
  return () => mediaQuery.removeEventListener("change", handler)
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getMatches, () => false)
}
