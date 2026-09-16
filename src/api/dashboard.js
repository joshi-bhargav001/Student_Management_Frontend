import { refreshAccessToken } from './auth'

const DASHBOARD_API_BASE = 'http://localhost:8080/api/dashboard'

function getAuthHeaders() {
  const token = localStorage.getItem('jwtToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function fetchWithRefresh(url, options = {}) {
  let res = await fetch(url, options)

  if (res.status === 401) {
    const storedRefresh = localStorage.getItem('refreshToken')
    if (!storedRefresh) return res
    try {
      const newToken = await refreshAccessToken(storedRefresh)
      localStorage.setItem('jwtToken', newToken)
      res = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${newToken}` } })
    } catch {
      return res
    }
  }

  return res
}

/**
 * GET /api/dashboard
 * Returns: { totalStudents, totalCourses, totalDivisions, totalTeachers,
 *            todayAttendance: { present, absent, leave, total, percentage },
 *            attendanceOverview: [{ date, present, absent, leave }],
 *            courseWiseStudents: [{ course, students }] }
 */
export async function fetchDashboard() {
  const res = await fetchWithRefresh(DASHBOARD_API_BASE, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch dashboard data')
  return res.json()
}
