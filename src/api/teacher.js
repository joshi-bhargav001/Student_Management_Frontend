import { refreshAccessToken } from './auth'

export const API_BASE_ADMIN = 'http://localhost:8080/api/teacher'
export const API_BASE_USER = 'http://localhost:8080/api/teacher'

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

export async function loadTeachers(params = {}, isAdmin = false) {
    const { page = 0, size = 7, keyword = '' } = params
    const base = isAdmin ? API_BASE_ADMIN : API_BASE_USER

    let url
    if (keyword.trim()) {
        url = `${base}/search?keyword=${encodeURIComponent(keyword.trim())}`
    } else {
        url = `${base}/pages?page=${page}&size=${size}`
    }

    const res = await fetchWithRefresh(url, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to load teachers')
    return res.json()
}

export async function createTeacher(data) {
    const res = await fetchWithRefresh(API_BASE_ADMIN, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create teacher')
    return res.json()
}

export async function deleteTeacher(id) {
    const res = await fetchWithRefresh(`${API_BASE_ADMIN}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    })

    if (!res.ok) throw new Error('Failed to delete teacher')
    return true
}

export async function updateTeacher(id, data) {
    const res = await fetchWithRefresh(`${API_BASE_ADMIN}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    })

    if (!res.ok) throw new Error('Failed to update teacher')
    return res.status === 204 ? null : res.json()
}
