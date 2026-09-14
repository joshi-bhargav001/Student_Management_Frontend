import React, { useEffect, useState, useMemo } from 'react'
import { fetchCoursesDropdown } from '../../api/course'
import { fetchDivisions } from '../../api/students'
import { fetchAttendance } from '../../api/attendance'

const FALLBACK_COURSE_OPTIONS = ['BCA', 'BBA', 'BSc', 'MCA']
const FALLBACK_DIVISION_OPTIONS = ['A', 'B', 'C']

const STATUS_CONFIG = {
  PRESENT: { label: 'Present', color: '#16a34a', bg: '#f0fdf4', dot: '#22c55e' },
  ABSENT:  { label: 'Absent',  color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
  LEAVE:   { label: 'Leave',   color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
}

function getTodayIsoDate() {
  const today = new Date()
  const year  = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day   = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const PAGE_SIZE = 7

export default function AttendanceSheet({ refreshTrigger }) {
  const [selectedDate, setSelectedDate]       = useState(getTodayIsoDate)
  const [course, setCourse]                   = useState('')
  const [division, setDivision]               = useState('')
  const [courseOptions, setCourseOptions]     = useState(FALLBACK_COURSE_OPTIONS)
  const [divisionOptions, setDivisionOptions] = useState(FALLBACK_DIVISION_OPTIONS)
  const [records, setRecords]                 = useState([])
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')
  const [viewed, setViewed]                   = useState(false)
  const [attempted, setAttempted]             = useState(false)
  const [currentPage, setCurrentPage]         = useState(0)

  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [courseData, divisionData] = await Promise.all([
          fetchCoursesDropdown(),
          fetchDivisions()
        ])
        const courses   = Array.isArray(courseData)   ? courseData.map(i => (typeof i === 'string' ? i : i.courseName   || i.name || '')).filter(Boolean) : []
        const divisions = Array.isArray(divisionData) ? divisionData.map(i => (typeof i === 'string' ? i : i.divisionName || i.name || '')).filter(Boolean) : []
        if (courses.length)   setCourseOptions(courses)
        if (divisions.length) setDivisionOptions(divisions)
      } catch { /* keep fallbacks */ }
    }
    loadDropdowns()
  }, [])

  useEffect(() => {
    if (refreshTrigger > 0 && viewed) {
      handleViewAttendance()
    }
  }, [refreshTrigger])

  const stats = useMemo(() => {
    const present = records.filter(r => (r.status || '').toUpperCase() === 'PRESENT').length
    const absent  = records.filter(r => (r.status || '').toUpperCase() === 'ABSENT').length
    const leave   = records.filter(r => (r.status || '').toUpperCase() === 'LEAVE').length
    return { total: records.length, present, absent, leave }
  }, [records])

  const totalPages  = Math.ceil(records.length / PAGE_SIZE)
  const pageRecords = records.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const handleViewAttendance = async () => {
    setAttempted(true)
    if (!course || !division) return
    setLoading(true)
    setError('')
    setViewed(false)
    setCurrentPage(0)
    try {
      const data = await fetchAttendance({ date: selectedDate, course, division })
      let list = []
      if (Array.isArray(data))                  list = data
      else if (Array.isArray(data?.attendances)) list = data.attendances
      else if (Array.isArray(data?.content))     list = data.content
      setRecords(list)
      setViewed(true)
    } catch {
      setError('Unable to load attendance records. Please try again.')
      setRecords([])
      setViewed(true)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setViewed(false)
    setRecords([])
    setError('')
    setAttempted(false)
    setCurrentPage(0)
  }

  const getStatus = (raw = '') => STATUS_CONFIG[(raw || '').toUpperCase()] || { label: raw || '—', color: '#64748b', bg: '#f8fafc', dot: '#64748b' }

  return (
    <div className="attendance-sheet-page">

      {/* ── Filter Card ─────────────────────────────── */}
      <div className="as-card as-filter-card">
        <div className="as-header-row">
          <div className="as-icon-wrap">
            <svg viewBox="0 0 24 24" className="as-icon" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="5" width="18" height="16" rx="2"/>
              <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round"/>
              <rect x="8" y="14" width="2" height="2" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div>
            <div className="as-title">Attendance Sheet</div>
            <div className="as-subtitle">View attendance by date, course and division</div>
          </div>
        </div>

        <div className="as-filters">
          <div className="as-filter-group">
            <label className="as-filter-label" htmlFor="as-date">Date</label>
            <div className="as-date-wrap">
              <svg viewBox="0 0 24 24" className="as-input-icon" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="16" rx="2"/>
                <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round"/>
              </svg>
              <input
                id="as-date"
                type="date"
                value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setViewed(false) }}
                className="as-date-input"
              />
            </div>
          </div>

          <div className="as-filter-group">
            <label className="as-filter-label" htmlFor="as-course">Course</label>
            <div className="as-select-wrap">
              <select
                id="as-course"
                value={course}
                onChange={e => { setCourse(e.target.value); setViewed(false) }}
                className="as-select"
              >
                <option value="">-- Select --</option>
                {courseOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span className="as-arrow">▼</span>
            </div>
          </div>

          <div className="as-filter-group">
            <label className="as-filter-label" htmlFor="as-division">Division</label>
            <div className="as-select-wrap">
              <select
                id="as-division"
                value={division}
                onChange={e => { setDivision(e.target.value); setViewed(false) }}
                className="as-select"
              >
                <option value="">-- Select --</option>
                {divisionOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span className="as-arrow">▼</span>
            </div>
          </div>
        </div>

        <div className="as-view-wrap">
          <button id="as-view-btn" type="button" className="as-view-btn" onClick={handleViewAttendance} disabled={loading}>
            {loading
              ? <><span className="as-spinner" aria-hidden="true"/> Loading...</>
              : <><span aria-hidden="true">🔍</span>&nbsp; View Attendance</>
            }
          </button>
          {attempted && (!course || !division) && (
            <div className="as-hint" role="alert">Please select a course and division.</div>
          )}
        </div>
      </div>

      {/* ── Results Card ─────────────────────────────── */}
      {viewed && (
        <div className="as-card as-results-card">
          {error ? (
            <div className="as-error" role="alert">{error}</div>
          ) : (
            <>
              <div className="as-results-header">
                <div>
                  <div className="as-results-title">Attendance — {course} / Division {division}</div>
                  <div className="as-results-date">{formatDisplayDate(selectedDate)}</div>
                </div>
                <div className="as-stats">
                  <div className="as-stat as-stat--total">
                    <span className="as-stat-icon">👥</span>
                    <div className="as-stat-body">
                      <div className="as-stat-label">Total Students</div>
                      <div className="as-stat-num">{stats.total}</div>
                    </div>
                  </div>
                  <div className="as-stat as-stat--present">
                    <span className="as-stat-dot" style={{ background: '#22c55e' }}/>
                    <div className="as-stat-body">
                      <div className="as-stat-label">Present</div>
                      <div className="as-stat-num" style={{ color: '#16a34a' }}>{stats.present}</div>
                    </div>
                  </div>
                  <div className="as-stat as-stat--absent">
                    <span className="as-stat-dot" style={{ background: '#ef4444' }}/>
                    <div className="as-stat-body">
                      <div className="as-stat-label">Absent</div>
                      <div className="as-stat-num" style={{ color: '#dc2626' }}>{stats.absent}</div>
                    </div>
                  </div>
                  <div className="as-stat as-stat--leave">
                    <span className="as-stat-dot" style={{ background: '#f59e0b' }}/>
                    <div className="as-stat-body">
                      <div className="as-stat-label">Leave</div>
                      <div className="as-stat-num" style={{ color: '#d97706' }}>{stats.leave}</div>
                    </div>
                  </div>
                </div>
              </div>

              {records.length === 0 ? (
                <div className="as-empty">No attendance records found for the selected filters.</div>
              ) : (
                <>
                  <div className="as-table-wrap">
                    <table className="as-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th>Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRecords.map((rec, idx) => {
                          const st     = getStatus(rec.status)
                          const rollNo = rec.rollNo ?? rec.rollno ?? rec.roll ?? rec.rollNumber ?? '—'
                          const name   = (rec.studentName ?? rec.name ?? [rec.firstName, rec.lastName].filter(Boolean).join(' ')) || 'Unknown'
                          return (
                            <tr key={rec.id ?? rec.studentId ?? idx}>
                              <td><strong>{currentPage * PAGE_SIZE + idx + 1}</strong></td>
                              <td>{rollNo}</td>
                              <td>{name}</td>
                              <td>
                                <span className="as-badge" style={{ color: st.color, background: st.bg }}>
                                  <span className="as-badge-dot" style={{ background: st.dot }}/>
                                  {st.label}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="as-pagination">
                    <div className="as-pg-info">
                      Showing {currentPage * PAGE_SIZE + 1} to {Math.min((currentPage + 1) * PAGE_SIZE, records.length)} of {records.length} students
                    </div>
                    {totalPages > 1 && (
                      <div className="as-pg-controls">
                        <button type="button" className="as-pg-nav" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>‹ Previous</button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button key={i} type="button" className={`as-pg-btn${currentPage === i ? ' active' : ''}`} onClick={() => setCurrentPage(i)}>{i + 1}</button>
                        ))}
                        <button type="button" className="as-pg-nav" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)}>Next ›</button>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
                <button type="button" className="as-reset-btn" onClick={handleReset}>↺ Reset</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
