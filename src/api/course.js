import { refreshAccessToken } from './auth'

export const API_BASE = 'http://localhost:8080/api/course'

function getAuthHeaders(extra = {}) {
    const token = localStorage.getItem('jwtToken')
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra
    }
}

/**
 * Fetch wrapper that automatically retries with a refreshed token on 401.
 */
async function fetchWithRefresh(url, options = {}) {
    let res = await fetch(url, options)

    if (res.status === 401) {
        const storedRefresh = localStorage.getItem('refreshToken')
        if (!storedRefresh) return res

        try {
            const newToken = await refreshAccessToken(storedRefresh)
            localStorage.setItem('jwtToken', newToken)

            const retryHeaders = {
                ...options.headers,
                Authorization: `Bearer ${newToken}`
            }
            res = await fetch(url, { ...options, headers: retryHeaders })
        } catch {
            return res
        }
    }

    return res
}

/**
 * GET all courses with optional pagination
 * GET http://localhost:8080/api/course/pages?page=0&size=10
 */
export async function loadCourses(params = {}) {
    const { page = 0, size = 6 } = params
    const url = `${API_BASE}/pages?page=${page}&size=${size}`
    const res = await fetchWithRefresh(url, { headers: getAuthHeaders() })
    if (!res.ok) {
        const fallback = await fetchWithRefresh(API_BASE, { headers: getAuthHeaders() })
        if (!fallback.ok) throw new Error('Failed to load courses')
        return fallback.json()
    }
    return res.json()
}

/**
 * Search courses by keyword
 * GET http://localhost:8080/api/course/search?keyword=
 */
export async function searchCourses(keyword = '') {
    const url = `${API_BASE}/search?keyword=${encodeURIComponent(keyword.trim())}`
    const res = await fetchWithRefresh(url, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to search courses')
    const data = await res.json()
    // Handle plain array or paginated response
    return Array.isArray(data) ? data : (data.content ?? [])
}

/**
 * POST create a new course
 * POST http://localhost:8080/api/course
 */
export async function createCourse(data) {
    const res = await fetchWithRefresh(API_BASE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create course')
    return res.json()
}

/**
 * PUT update an existing course
 * PUT http://localhost:8080/api/course/{id}
 */
export async function updateCourse(id, data) {
    const res = await fetchWithRefresh(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to update course')
    return res.status === 204 ? null : res.json()
}

/**
 * DELETE a course by id
 * DELETE http://localhost:8080/api/course/{id}
 */
export async function deleteCourse(id) {
    const res = await fetchWithRefresh(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to delete course')
    return true
}
