import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { loginUser, refreshAccessToken, sendOtp } from '../api/auth'

const AuthContext = createContext(null)

function decodeJwtPayload(token) {
  if (!token) return null

  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=')
    return JSON.parse(window.atob(padded))
  } catch {
    return null
  }
}

function getTokenExpiryTime(token) {
  const payload = decodeJwtPayload(token)
  const exp = Number(payload?.exp)
  return Number.isFinite(exp) ? exp * 1000 : null
}

function isTokenExpired(token) {
  const expiryTime = getTokenExpiryTime(token)
  return !expiryTime || expiryTime <= Date.now()
}

function safeParseJson(value) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function normalizeRole(role) {
  if (!role) {
    console.log('normalizeRole: role is empty, returning USER')
    return 'USER'
  }
  const value = String(role).trim().toUpperCase()
  console.log('normalizeRole: raw role =', role, '-> uppercase =', value)

  // Handle various role formats from Spring Boot
  if (value.includes('ADMIN') || value === 'ROLE_ADMIN' || value === 'ADMINISTRATOR') {
    console.log('normalizeRole: detected ADMIN role')
    return 'ADMIN'
  }
  console.log('normalizeRole: defaulting to USER')
  return 'USER'
}

function normalizeUser(rawUser, fallbackUsername) {
  if (!rawUser || typeof rawUser !== 'object') {
    console.log('normalizeUser: rawUser is null/invalid, using fallback')
    return {
      id: null,
      name: fallbackUsername || 'User',
      username: fallbackUsername || 'user',
      role: 'USER'
    }
  }

  // Extract role from various possible locations
  let roleValue = null

  // Try direct role field
  if (rawUser.role) {
    roleValue = rawUser.role
    console.log('normalizeUser: found role in rawUser.role =', roleValue)
  }
  // Try roles array
  else if (Array.isArray(rawUser.roles) && rawUser.roles.length > 0) {
    roleValue = rawUser.roles[0]
    console.log('normalizeUser: found role in rawUser.roles[0] =', roleValue)
    // If it's an object with 'authority' field (Spring Security)
    if (typeof roleValue === 'object' && roleValue.authority) {
      roleValue = roleValue.authority
      console.log('normalizeUser: extracted authority from role object =', roleValue)
    }
  }
  // Try authorities array
  else if (Array.isArray(rawUser.authorities) && rawUser.authorities.length > 0) {
    roleValue = rawUser.authorities[0]
    console.log('normalizeUser: found role in rawUser.authorities[0] =', roleValue)
    if (typeof roleValue === 'object' && roleValue.authority) {
      roleValue = roleValue.authority
      console.log('normalizeUser: extracted authority from authorities object =', roleValue)
    }
  }
  // Try grantedAuthorities
  else if (Array.isArray(rawUser.grantedAuthorities) && rawUser.grantedAuthorities.length > 0) {
    roleValue = rawUser.grantedAuthorities[0]
    console.log('normalizeUser: found role in rawUser.grantedAuthorities[0] =', roleValue)
    if (typeof roleValue === 'object' && roleValue.authority) {
      roleValue = roleValue.authority
      console.log('normalizeUser: extracted authority from grantedAuthorities object =', roleValue)
    }
  }
  else {
    console.log('normalizeUser: no role found in any location. Available fields:', Object.keys(rawUser))
  }

  const normalizedRole = normalizeRole(roleValue)
  console.log('normalizeUser: final normalized role =', normalizedRole)

  return {
    id: rawUser.id ?? rawUser.userId ?? rawUser.sub ?? null,
    name: rawUser.name ?? rawUser.fullName ?? rawUser.fullname ?? (fallbackUsername || 'User'),
    username: rawUser.username ?? rawUser.userName ?? (fallbackUsername || 'user'),
    role: normalizedRole
  }
}

function readStoredAuth() {
  if (typeof window === 'undefined') return { token: null, refreshToken: null, user: null }
  const token = window.localStorage.getItem('jwtToken')
  const refreshToken = window.localStorage.getItem('refreshToken')
  const storedUser = window.localStorage.getItem('currentUser')

  if (token && isTokenExpired(token)) {
    // Don't clear here — let AuthProvider attempt refresh on mount
    return { token: null, refreshToken, user: safeParseJson(storedUser) }
  }

  return {
    token,
    refreshToken,
    user: safeParseJson(storedUser)
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStoredAuth().token)
  const [user, setUser] = useState(() => readStoredAuth().user)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const refreshTokenRef = useRef(readStoredAuth().refreshToken)

  const isAuthenticated = Boolean(token)

  const persistAuth = (nextToken, nextUser, nextRefreshToken) => {
    if (typeof window === 'undefined') return
    if (nextToken) {
      window.localStorage.setItem('jwtToken', nextToken)
    } else {
      window.localStorage.removeItem('jwtToken')
    }
    if (nextRefreshToken !== undefined) {
      if (nextRefreshToken) {
        window.localStorage.setItem('refreshToken', nextRefreshToken)
        refreshTokenRef.current = nextRefreshToken
      } else {
        window.localStorage.removeItem('refreshToken')
        refreshTokenRef.current = null
      }
    }
    if (nextUser) {
      window.localStorage.setItem('currentUser', JSON.stringify(nextUser))
    } else {
      window.localStorage.removeItem('currentUser')
    }
  }

  function clearAuthState(message = '') {
    setToken(null)
    setUser(null)
    setAuthError(message)
    persistAuth(null, null, null)
  }

  // Attempt a silent token refresh. Returns new token or null.
  const doRefresh = useCallback(async () => {
    const storedRefresh = refreshTokenRef.current || window.localStorage.getItem('refreshToken')
    if (!storedRefresh) return null
    try {
      const newToken = await refreshAccessToken(storedRefresh)
      setToken(newToken)
      window.localStorage.setItem('jwtToken', newToken)
      return newToken
    } catch {
      clearAuthState('Your session has expired. Please sign in again.')
      return null
    }
  }, [])

  useEffect(() => {
    if (!token) {
      // If no access token but refresh token exists, try refreshing on mount
      const storedRefresh = refreshTokenRef.current || window.localStorage.getItem('refreshToken')
      if (storedRefresh) doRefresh()
      return undefined
    }

    const expiryTime = getTokenExpiryTime(token)
    if (!expiryTime || expiryTime <= Date.now()) {
      doRefresh()
      return undefined
    }

    // Schedule a refresh 30 seconds before the token expires
    const refreshAt = expiryTime - Date.now() - 30_000
    const timeoutId = window.setTimeout(() => {
      doRefresh()
    }, Math.max(refreshAt, 0))

    return () => window.clearTimeout(timeoutId)
  }, [token, doRefresh])

  async function requestOtp(payload) {
    setLoading(true)
    setAuthError('')
    try {
      const response = await sendOtp(payload)
      return { success: true, message: response?.message || response?.detail || 'OTP sent successfully' }
    } catch (error) {
      const message = error?.message || 'Failed to send OTP'
      setAuthError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  async function login(payload) {
    setLoading(true)
    setAuthError('')
    try {
      const response = await loginUser(payload)
      console.log('=== LOGIN RESPONSE (FULL) ===')
      console.log(JSON.stringify(response, null, 2))
      console.log('Response keys:', Object.keys(response))

      const nextToken = response?.token || response?.jwt || response?.accessToken || response?.access_token || response?.data?.token || response?.data?.jwt || ''
      if (!nextToken) {
        throw new Error('No authentication token was returned by the server')
      }
      if (isTokenExpired(nextToken)) {
        throw new Error('The server returned an expired token. Please sign in again.')
      }
      console.log('Token extracted:', nextToken.substring(0, 50) + '...')

      // Extract refresh token from login response
      const nextRefreshToken = response?.refreshToken || response?.refresh_token || response?.data?.refreshToken || ''

      // Check for nested user object first, then fall back to flat response structure
      let responseUser = response?.user || response?.userInfo || response?.data?.user || response?.data?.userInfo || response?.payload?.user || response?.data?.payload?.user || null

      // If no nested user object, treat the entire response as user data (flat structure)
      if (!responseUser) {
        responseUser = {
          id: response?.id,
          name: response?.name,
          username: response?.username,
          role: response?.role
        }
        console.log('Using flat response structure as user object')
      }

      console.log('=== EXTRACTED USER OBJECT (FULL) ===')
      console.log(JSON.stringify(responseUser, null, 2))
      if (responseUser) {
        console.log('User object keys:', Object.keys(responseUser))
        console.log('User.role:', responseUser.role)
        console.log('User.roles:', responseUser.roles)
        console.log('User.authorities:', responseUser.authorities)
        console.log('User.grantedAuthorities:', responseUser.grantedAuthorities)
      }

      const nextUser = normalizeUser(responseUser, payload.username)
      console.log('=== NORMALIZED USER (FINAL) ===')
      console.log(JSON.stringify(nextUser, null, 2))

      setToken(nextToken)
      setUser(nextUser)
      persistAuth(nextToken, nextUser, nextRefreshToken || null)
      return { success: true, user: nextUser }
    } catch (error) {
      const message = error?.message || 'Login failed'
      setAuthError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    clearAuthState('')
  }

  const value = useMemo(() => ({
    user,
    token,
    loading,
    authError,
    isAuthenticated,
    login,
    requestOtp,
    logout,
    doRefresh
  }), [user, token, loading, authError, isAuthenticated, doRefresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
