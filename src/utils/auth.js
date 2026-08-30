const TOKEN_KEY = 'point_track_token'
const USER_INFO_KEY = 'point_track_user_info'
const COOKIE_DAYS = 30

function setCookie(name, value, days = COOKIE_DAYS) {
  try {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    const attrs = 'SameSite=Lax; Secure'
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; ${attrs}`
  } catch (e) {
    console.warn('[auth] setCookie failed:', e)
  }
}

function getCookie(name) {
  try {
    const match = document.cookie.match(
      new RegExp('(?:^|;\\s*)' + name.replace(/[-.+*]/g, '\\$&') + '\\s*\\=\\s*([^;]+)')
    )
    return match ? decodeURIComponent(match[1]) : null
  } catch (e) {
    return null
  }
}

function removeCookie(name) {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax; Secure`
  } catch (e) {
    console.warn('[auth] removeCookie failed:', e)
  }
}

function safeLS() {
  try {
    const k = '__ls_probe__'
    localStorage.setItem(k, '1')
    localStorage.removeItem(k)
    return localStorage
  } catch (_) {
    return null
  }
}

function setLS(name, value) {
  const ls = safeLS()
  if (!ls) return
  try {
    ls.setItem(name, value)
  } catch (_) {
  }
}

function getLS(name) {
  const ls = safeLS()
  if (!ls) return null
  try {
    return ls.getItem(name)
  } catch (_) {
    return null
  }
}

function removeLS(name) {
  const ls = safeLS()
  if (!ls) return
  try {
    ls.removeItem(name)
  } catch (_) {
  }
}

export function setToken(token) {
  setLS(TOKEN_KEY, token)
  setCookie(TOKEN_KEY, token)
}

export function getToken() {
  const fromCookie = getCookie(TOKEN_KEY)
  if (fromCookie) return fromCookie
  return getLS(TOKEN_KEY)
}

export function removeToken() {
  removeLS(TOKEN_KEY)
  removeCookie(TOKEN_KEY)
}

export function setUserInfo(info) {
  if (info == null) {
    removeLS(USER_INFO_KEY)
    removeCookie(USER_INFO_KEY)
    return
  }
  const str = JSON.stringify(info)
  setLS(USER_INFO_KEY, str)
  setCookie(USER_INFO_KEY, str)
}

export function getUserInfo() {
  let raw = getCookie(USER_INFO_KEY)
  if (!raw) raw = getLS(USER_INFO_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

export function removeUserInfo() {
  removeLS(USER_INFO_KEY)
  removeCookie(USER_INFO_KEY)
}
