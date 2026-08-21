const API_BASE = 'http://localhost:8080/api/auth'

function buildResponseError(res, fallback) {
  return res.text().then((text) => {
    if (!text) return fallback
    try {
      const parsed = JSON.parse(text)
      if (parsed?.message) return parsed.message
      if (parsed?.error) return parsed.error
      return text
    } catch {
      return text
    }
  }).catch(() => fallback)
}

export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const message = await buildResponseError(res, 'Registration failed')
    throw new Error(message)
  }

  return res.json()
}

export async function sendOtp(payload) {
  const res = await fetch(`${API_BASE}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const message = await buildResponseError(res, 'Failed to send OTP')
    throw new Error(message)
  }

  return res.json().catch(() => ({}))
}

export async function verifyOtp(payload) {
  const res = await fetch(`${API_BASE}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const message = await buildResponseError(res, 'OTP verification failed')
    throw new Error(message)
  }

  return res.json().catch(() => ({}))
}

export async function loginUser(payload) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const message = await buildResponseError(res, 'Login failed')
    throw new Error(message)
  }

  return res.json()
}

/**
 * Call POST /api/auth/refresh with the stored refresh token.
 * Returns the new access token string, or throws if refresh failed.
 */
export async function refreshAccessToken(refreshToken) {
  const res = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })

  if (!res.ok) {
    const message = await buildResponseError(res, 'Session expired. Please sign in again.')
    throw new Error(message)
  }

  const data = await res.json()
  // Support various response field names from the backend
  const newToken = data?.token || data?.accessToken || data?.access_token || data?.jwt || ''
  if (!newToken) throw new Error('No token returned from refresh endpoint')
  return newToken
}
