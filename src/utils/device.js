export const MOBILE_BREAKPOINT = 768

export function isMobile () {
  if (typeof window === 'undefined') return false
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
}
