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
