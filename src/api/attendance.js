import { refreshAccessToken } from './auth'

export const ATTENDANCE_API_BASE = 'http://localhost:8080/api/attendance'

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
  let res
  try {
    res = await fetch(url, options)
  } catch {
    throw new Error('Unable to connect to the attendance server. Check that the backend is running on http://localhost:8080.')
  }

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
      try {
        res = await fetch(url, { ...options, headers: retryHeaders })
      } catch {
        throw new Error('Unable to connect to the attendance server after refreshing the session.')
      }
    } catch {
      return res
    }
  }

  return res
}

/**
 * Save attendance records.
 * POST /api/attendance
 *
 * Payload:
 * {
 *   date: "YYYY-MM-DD",
 *   course: "BCA",
 *   division: "A",
 *   attendanceRecords: [
 *     { studentId: 1, status: "Present" },
 *     { studentId: 2, status: "Absent" },
 *     ...
 *   ]
 * }
 */
function buildAttendancePayload(date, attendanceRecords) {
  const attendances = attendanceRecords.map(record => {
    if (!record.studentId || isNaN(record.studentId)) {
      throw new Error(`Invalid Student ID: ${record.studentId}`)
    }
    if (!record.status) {
      throw new Error(`Attendance status is required for student ID: ${record.studentId}`)
    }

    return {
      studentId: Number(record.studentId),
      status: record.status.toUpperCase(),
      date: date
    }
  })

  return { attendances }
}

async function sendAttendanceRequest(url, method, payload) {
  const res = await fetchWithRefresh(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    let cleanMsg = res.status === 401
      ? 'Your session has expired. Please sign in again.'
      : res.status === 403
        ? 'You are not authorized to save attendance. Please sign in with an admin account.'
        : `Server error (${res.status})`
    try {
      const parsed = JSON.parse(errorText)
      if (parsed.message) {
        cleanMsg = parsed.message
      } else if (parsed.error) {
        cleanMsg = parsed.error
      }
      if (parsed.validationErrors) {
        const vals = typeof parsed.validationErrors === 'object'
          ? Object.values(parsed.validationErrors).join(', ')
          : String(parsed.validationErrors)
        if (vals) cleanMsg += `: ${vals}`
      }
    } catch {
      if (errorText) cleanMsg = errorText
    }
    throw new Error(cleanMsg)
  }

  return res.json().catch(() => ({ success: true }))
}

/** Create attendance records. POST /api/attendance */
export async function saveAttendance({ date, attendanceRecords }) {
  const payload = buildAttendancePayload(date, attendanceRecords)
  return sendAttendanceRequest(ATTENDANCE_API_BASE, 'POST', payload)
}

/** Update an existing attendance record. PUT /api/attendance/{id} */
export async function updateAttendance({ id, date, attendanceRecords }) {
  if (!id) throw new Error('Attendance ID is required to update attendance')

  const payload = buildAttendancePayload(date, attendanceRecords)
  return sendAttendanceRequest(`${ATTENDANCE_API_BASE}/${encodeURIComponent(id)}`, 'PUT', payload)
}

export async function updateSingleAttendance(id, date, studentId, status) {
  if (!id) throw new Error('Attendance ID is required')
  const payload = {
    studentId: Number(studentId),
    status: status.toUpperCase(),
    date: date
  }
  return sendAttendanceRequest(`${ATTENDANCE_API_BASE}/${encodeURIComponent(id)}`, 'PUT', payload)
}

/**
 * Fetch attendance records for a given date, course, and division.
 * GET /api/attendance?date=YYYY-MM-DD&course=BCA&division=A
 */
export async function fetchAttendance({ date, course, division } = {}) {
  const params = new URLSearchParams()
  if (date) params.set('date', date)
  if (course) params.set('course', course)
  if (division) params.set('division', division)

  const url = `${ATTENDANCE_API_BASE}${params.toString() ? `?${params.toString()}` : ''}`
  const res = await fetchWithRefresh(url, { headers: getAuthHeaders() })

  if (!res.ok) throw new Error('Failed to fetch attendance records')
  return res.json()
}
