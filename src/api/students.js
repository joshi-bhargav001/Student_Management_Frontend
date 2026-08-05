import { refreshAccessToken } from './auth'

export const API_BASE = 'http://localhost:8080/api/students'

export function getStudentPhotoUrl(id) {
  if (id === undefined || id === null || id === '') return ''
  return `${API_BASE}/${id}/photo`
}

export async function fetchStudentPhotoBlob(id) {
  const res = await fetchWithRefresh(getStudentPhotoUrl(id), { headers: getAuthHeaders() })
  if (res.status === 403 || res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch student photo')

  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('jwtToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  }
}

function getMultipartAuthHeaders(extra = {}) {
  const token = localStorage.getItem('jwtToken')
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  }
}

/**
 * Fetch wrapper that automatically retries with a refreshed token on 401.
 * On second failure, throws so the caller (and AuthContext) can log the user out.
 */
async function fetchWithRefresh(url, options = {}) {
  let res = await fetch(url, options)

  if (res.status === 401) {
    // Try to get a new access token
    const storedRefresh = localStorage.getItem('refreshToken')
    if (!storedRefresh) return res // no refresh token — return 401 as-is

    try {
      const newToken = await refreshAccessToken(storedRefresh)
      localStorage.setItem('jwtToken', newToken)

      // Rebuild headers with the new token and retry once
      const retryHeaders = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`
      }
      res = await fetch(url, { ...options, headers: retryHeaders })
    } catch {
      // Refresh failed — return the original 401 so callers can handle it
      return res
    }
  }

  return res
}

function buildQuery(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })

  return query.toString()
}

function normalizePageResponse(data, fallbackSize = 7) {
  const content =
    Array.isArray(data) ? data :
      Array.isArray(data?.content) ? data.content :
        Array.isArray(data?.students) ? data.students :
          Array.isArray(data?.data) ? data.data :
            []

  const page = Number.isFinite(Number(data?.number)) ? Number(data.number) : 0
  const size = Number.isFinite(Number(data?.size)) ? Number(data.size) : fallbackSize
  const totalElements = Number.isFinite(Number(data?.totalElements)) ? Number(data.totalElements) : content.length
  const totalPages = Number.isFinite(Number(data?.totalPages)) ? Number(data.totalPages) : (size > 0 ? Math.ceil(totalElements / size) : 1)

  return {
    content,
    pageInfo: {
      page,
      size,
      totalElements,
      totalPages,
      numberOfElements: content.length,
      first: Boolean(data?.first ?? page === 0),
      last: Boolean(data?.last ?? page >= Math.max(totalPages - 1, 0))
    }
  }
}

export async function fetchStudents() {
  const res = await fetchWithRefresh(API_BASE, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch students')
  return res.json()
}

export async function fetchStudentsPage({ page = 0, size = 7, sortBy, direction, keyword = '' } = {}) {
  if (keyword && keyword.trim()) {
    const searchQuery = buildQuery({ keyword: keyword.trim() })
    const res = await fetchWithRefresh(`${API_BASE}/search${searchQuery ? `?${searchQuery}` : ''}`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to search students')
    const data = await res.json()
    return normalizePageResponse(data, size)
  }

  const query = buildQuery({ page, size, sortby: sortBy, direction })
  const res = await fetchWithRefresh(`${API_BASE}/pages${query ? `?${query}` : ''}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch students')
  const data = await res.json()
  return normalizePageResponse(data, size)
}

export async function fetchStudent(id) {
  const res = await fetchWithRefresh(`${API_BASE}/${id}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch student')
  return res.json()
}

export async function createStudent(data) {
  const res = await fetchWithRefresh(API_BASE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create student')
  return res.json()
}

export async function updateStudent(id, data) {
  const res = await fetchWithRefresh(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update student')
  return res.json()
}

export async function deleteStudent(id) {
  const res = await fetchWithRefresh(`${API_BASE}/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to delete student')
  return true
}

export async function deleteStudentPhoto(id) {
  const res = await fetchWithRefresh(`${API_BASE}/${id}/delete-photo`, { method: 'DELETE', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to delete student photo')
  return true
}

export async function uploadStudentPhoto(id, file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetchWithRefresh(`${API_BASE}/${id}/upload-photo`, {
    method: 'POST',
    headers: getMultipartAuthHeaders(),
    body: formData
  })

  if (!res.ok) throw new Error('Failed to upload student photo')

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }

  return null
}
