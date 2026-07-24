export const API_BASE = 'http://localhost:8080/api/students'

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('jwtToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  }
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
  const res = await fetch(API_BASE, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch students')
  return res.json()
}

export async function fetchStudentsPage({ page = 0, size = 7, sortBy, direction, keyword = '' } = {}) {
  if (keyword && keyword.trim()) {
    const searchQuery = buildQuery({ keyword: keyword.trim() })
    const res = await fetch(`${API_BASE}/search${searchQuery ? `?${searchQuery}` : ''}`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to search students')
    const data = await res.json()
    return normalizePageResponse(data, size)
  }

  const query = buildQuery({ page, size, sortby: sortBy, direction })
  const res = await fetch(`${API_BASE}/pages${query ? `?${query}` : ''}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch students')
  const data = await res.json()
  return normalizePageResponse(data, size)
}

export async function fetchStudent(id) {
  const res = await fetch(`${API_BASE}/${id}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch student')
  return res.json()
}

export async function createStudent(data) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create student')
  return res.json()
}

export async function updateStudent(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update student')
  return res.json()
}

export async function deleteStudent(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to delete student')
  return true
}
