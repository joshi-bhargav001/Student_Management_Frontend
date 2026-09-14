import React, { useEffect, useMemo, useState } from 'react'
import { fetchCoursesDropdown } from '../../api/course'
import { fetchDivisions, fetchStudentsByFilter } from '../../api/students'
import { saveAttendance, updateAttendance, fetchAttendance, updateSingleAttendance } from '../../api/attendance'
import { useConfirm } from '../../context/ConfirmDialogContext'
import { useAuth } from '../../context/AuthContext'
import AttendanceSheet from './AttendanceSheet'

const FALLBACK_COURSE_OPTIONS = ['BCA', 'BBA', 'BSc', 'MCA']
const FALLBACK_DIVISION_OPTIONS = ['A', 'B', 'C']

const defaultStudents = [
  { id: 1, rollNo: '101', name: 'Rahul Patel', status: '' },
  { id: 2, rollNo: '102', name: 'Amit Shah', status: '' },
  { id: 3, rollNo: '103', name: 'Jay Joshi', status: '' },
  { id: 4, rollNo: '104', name: 'Ravi Kumar', status: '' },
  { id: 5, rollNo: '105', name: 'Karan Patel', status: '' }
]

const statusOptions = ['Present', 'Absent', 'Leave']

function formatDate(dateValue) {
  if (!dateValue) return ''
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return dateValue

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${d.getFullYear()}`
}

function getTodayIsoDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Attendance() {
  const confirm = useConfirm()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate)
  const [course, setCourse] = useState('')
  const [division, setDivision] = useState('')
  const [courseOptions, setCourseOptions] = useState(FALLBACK_COURSE_OPTIONS)
  const [divisionOptions, setDivisionOptions] = useState(FALLBACK_DIVISION_OPTIONS)
  const [students, setStudents] = useState(defaultStudents)
  const [loaded, setLoaded] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [saving, setSaving] = useState(false)
  // Toast notification state: { type: 'success' | 'error' | 'warning', message: string }
  const [toast, setToast] = useState(null)
  // Persists status selections across page changes: { [studentId]: 'Present' | 'Absent' | 'Leave' }
  const [allStatuses, setAllStatuses] = useState({})
  // Tracks the last saved attendance status to show green/blue action state in the table.
  const [savedStatuses, setSavedStatuses] = useState({})
  // Tracks backend attendance record IDs per student: { [studentId]: recordId }
  const [recordIds, setRecordIds] = useState({})
  const [attendanceId, setAttendanceId] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  // Tracks whether user has clicked Load Students at least once (for showing validation hint)
  const [attempted, setAttempted] = useState(false)

  // Auto-dismiss toast notification after 4.5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [courseData, divisionData] = await Promise.all([
          fetchCoursesDropdown(),
          fetchDivisions()
        ])

        const extractedCourses = Array.isArray(courseData)
          ? courseData
              .map(item => typeof item === 'string' ? item : (item.courseName || item.name || item.course || ''))
              .filter(Boolean)
          : []

        const extractedDivisions = Array.isArray(divisionData)
          ? divisionData
              .map(item => typeof item === 'string' ? item : (item.divisionName || item.name || item.division || ''))
              .filter(Boolean)
          : []

        if (extractedCourses.length > 0) {
          setCourseOptions(extractedCourses)
        }

        if (extractedDivisions.length > 0) {
          setDivisionOptions(extractedDivisions)
        }
      } catch (error) {
        console.error('Failed to load attendance dropdown options:', error)
        setCourseOptions(FALLBACK_COURSE_OPTIONS)
        setDivisionOptions(FALLBACK_DIVISION_OPTIONS)
      }
    }

    loadDropdowns()
  }, [])

  const formattedDate = useMemo(() => formatDate(selectedDate), [selectedDate])

  const loadPage = async (pageToLoad, currentStatuses = allStatuses) => {
    setLoadingStudents(true)
    setLoadError('')

    try {
      const response = await fetchStudentsByFilter({
        course,
        division,
        page: pageToLoad,
        size: 7
      })

      const fetchedStudents = (response.content || []).map((student, index) => {
        const id = student.id ?? student.studentId ?? student._id ?? (index + 1)
        return {
          id,
          rollNo: student.rollNo ?? student.rollno ?? student.roll ?? student.rollNumber ?? '',
          name: student.name || [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Unnamed Student',
          // Preserve selected status if exists; default to empty (unselected)
          status: currentStatuses[id] ?? ''
        }
      })

      setStudents(fetchedStudents)
      setCurrentPage(response.pageInfo?.page || 0)
      setTotalPages(response.pageInfo?.totalPages || 0)
      setTotalElements(response.pageInfo?.totalElements || 0)
      setLoaded(true)
    } catch (error) {
      console.error('Failed to load attendance students:', error)
      setStudents([])
      setLoadError('Unable to load students for this course and division.')
      setToast({ type: 'error', message: 'Unable to load students for this course and division.' })
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleLoadStudents = async () => {
    setAttempted(true)
    if (!course || !division) return
    
    setLoadingStudents(true)
    let initialStatuses = {}
    let initialIds = {}
    
    try {
      const attData = await fetchAttendance({ date: selectedDate, course, division })
      let attRecords = []
      let attId = null
      
      if (attData && !Array.isArray(attData)) {
        attId = attData.id || attData.attendanceId
        attRecords = attData.attendances || attData.content || []
      } else if (Array.isArray(attData)) {
        attRecords = attData
        if (attRecords.length > 0) {
          attId = attRecords[0].attendanceId || attRecords[0].id // Fallback if id is in records
        }
      }
      
      if (attId) setAttendanceId(attId)
      
      attRecords.forEach(r => {
        const sId = r.studentId || r.student?.id
        if (sId) {
          initialStatuses[sId] = (r.status || '').charAt(0).toUpperCase() + (r.status || '').slice(1).toLowerCase()
          initialIds[sId] = r.id || r.attendanceId || r.attendance?.id
        }
      })
      
      setAllStatuses(initialStatuses)
      setSavedStatuses(initialStatuses)
      setRecordIds(initialIds)
    } catch (e) {
      // If fetching fails (e.g. 404 not found), we just start fresh
      setAllStatuses({})
      setSavedStatuses({})
      setRecordIds({})
      setAttendanceId(null)
    }
    
    await loadPage(0, initialStatuses)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      loadPage(newPage)
    }
  }

  const handleStatusChange = (studentId, status) => {
    // Update display state for current page
    setStudents(currentStudents => currentStudents.map(student =>
      student.id === studentId ? { ...student, status } : student
    ))
    // Persist to the cross-page status map
    setAllStatuses(prev => ({ ...prev, [studentId]: status }))
  }

  const handleMarkAllPresent = () => {
    // Update display state for current page
    setStudents(currentStudents => currentStudents.map(student => ({ ...student, status: 'Present' })))
    // Persist all current page students as Present in the map
    setAllStatuses(prev => {
      const updated = { ...prev }
      students.forEach(student => { updated[student.id] = 'Present' })
      return updated
    })
  }

  const handleChangeSelection = () => {
    setLoaded(false)
    setLoadError('')
    setCurrentPage(0)
    setTotalPages(0)
    setTotalElements(0)
    setStudents([])
    setAllStatuses({})  // Clear all saved statuses when starting fresh
    setSavedStatuses({})
    setRecordIds({})
    setAttendanceId(null)
  }

  const getStudentActionState = (student) => {
    const savedStatus = savedStatuses[student.id]

    if (!student.status) {
      return { tickClass: 'attendance-action-empty', tick: '' }
    }

    if (savedStatus && savedStatus !== student.status) {
      return { tickClass: 'attendance-action-blue', tick: '✓' }
    }

    if (savedStatus && savedStatus === student.status) {
      return { tickClass: 'attendance-action-green', tick: '✓' }
    }

    return { tickClass: 'attendance-action-green', tick: '✓' }
  }

  const getSelectedAttendanceRecords = () => {
    // Build attendance records from the full allStatuses map (covers ALL pages)
    const mergedStatuses = { ...allStatuses }
    students.forEach(student => {
      if (student.status) {
        mergedStatuses[student.id] = student.status
      }
    })

    const attendanceRecords = Object.entries(mergedStatuses)
      .filter(([studentId, status]) => studentId && status && !isNaN(Number(studentId)))
      .map(([studentId, status]) => ({
        studentId: Number(studentId),
        status
      }))

    if (attendanceRecords.length === 0) {
      setToast({ type: 'warning', message: 'No valid attendance records to save.' })
      return null
    }

    return attendanceRecords
  }

  const handleSaveAttendance = () => {
    const attendanceRecords = getSelectedAttendanceRecords()
    if (!attendanceRecords) return

    confirm({
      title: 'Save Attendance?',
      message: `Are you sure you want to save attendance for ${course} - Division ${division}?`,
      confirmText: 'Save',
      confirmBtnClass: 'btn-primary',
      successMessage: 'Transaction completed',
      onConfirm: async () => {
        setSaving(true)
        try {
          const result = await saveAttendance({ date: selectedDate, attendanceRecords })

          const nextAttendanceId = result?.id ?? result?.attendanceId ?? result?.attendance?.id ?? result?.attendance?.attendanceId ?? attendanceId
          if (nextAttendanceId) {
            setAttendanceId(nextAttendanceId)
          }

          const nextSaved = {}
          students.forEach(student => {
            if (student.status) nextSaved[student.id] = student.status
          })
          setSavedStatuses(prev => ({ ...prev, ...nextSaved }))
          
          setRefreshTrigger(prev => prev + 1)
        } finally {
          setSaving(false)
        }
      }
    }).catch(error => {
      if (error) {
        console.error('Failed to save attendance:', error)
        setToast({ type: 'error', message: error.message || 'Failed to save attendance. Please try again.' })
      }
    })
  }

  const handleUpdateAttendance = () => {
    const attendanceRecords = getSelectedAttendanceRecords()
    if (!attendanceRecords) return

    confirm({
      title: 'Update Attendance?',
      message: `Are you sure you want to update attendance for ${course} - Division ${division}?`,
      confirmText: 'Update',
      confirmBtnClass: 'btn-primary',
      successMessage: 'Transaction completed',
      onConfirm: async () => {
        setSaving(true)
        
        // 1-second delay as requested before showing success and running API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        try {
          const promises = []
          const toCreate = []

          attendanceRecords.forEach(rec => {
            const rId = recordIds[rec.studentId]
            if (rId) {
              if (rec.status !== savedStatuses[rec.studentId]) {
                promises.push(updateSingleAttendance(rId, selectedDate, rec.studentId, rec.status))
              }
            } else {
              toCreate.push(rec)
            }
          })

          if (toCreate.length > 0) {
            promises.push(saveAttendance({ date: selectedDate, attendanceRecords: toCreate }))
          }

          if (promises.length === 0) {
            setToast({ type: 'warning', message: 'No changes detected to update.' })
            setSaving(false)
            return
          }

          await Promise.all(promises)
          
          // Refresh the data to grab any newly created IDs and reset statuses
          await handleLoadStudents()
          
          setRefreshTrigger(prev => prev + 1)
        } catch (error) {
          console.error('Failed to update attendance:', error)
          setToast({ type: 'error', message: error.message || 'Failed to update attendance. Please try again.' })
        } finally {
          setSaving(false)
        }
      }
    }).catch(error => {
      if (error) {
        console.error('Failed to update attendance:', error)
      }
    })
  }

  return (
    <div className={`attendance-page ${isAdmin ? 'attendance-page-admin' : ''}`}>

      {/* â”€â”€â”€ ROLE_USER: show only View Attendance â”€â”€â”€ */}
      {!isAdmin && (
        <AttendanceSheet />
      )}

      {/* â”€â”€â”€ ROLE_ADMIN: Take Attendance panel â”€â”€â”€ */}
      {isAdmin && (
        <div className={`attendance-panel ${loaded ? 'attendance-panel-list' : 'attendance-panel-form'}`}>
          {loaded ? (
            <>
            <div className="attendance-loaded-header">
              <div className="attendance-loaded-heading">
                <div className="attendance-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="attendance-icon">
                    <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2.2"/>
                    <path d="M8 3v4M16 3v4M3 10h18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                    <path d="M8 14h3v3H8z" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <div className="attendance-loaded-title">
                    Attendance <span> {course} / Division {division}</span>
                  </div>
                  <div className="attendance-loaded-date">{formattedDate}</div>
                </div>
              </div>
            </div>

            <div className="attendance-filter-row">
              <div className="attendance-filter-field">
                <label className="attendance-filter-label">Date</label>
                <div className="attendance-filter-control attendance-input-box attendance-date-box">
                  <input
                    type="date"
                    value={selectedDate}
                    disabled
                    className="attendance-date-picker"
                    aria-label="Attendance date"
                  />
                  <div className="attendance-date-text">{formattedDate}</div>
                </div>
              </div>

              <div className="attendance-filter-field">
                <label className="attendance-filter-label">Course</label>
                <div className="attendance-filter-control attendance-select-box">
                  <select value={course} disabled className="attendance-select">
                    {courseOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="attendance-filter-field">
                <label className="attendance-filter-label">Division</label>
                <div className="attendance-filter-control attendance-select-box">
                  <select value={division} disabled className="attendance-select">
                    {divisionOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="button" className="change-selection-btn" onClick={handleChangeSelection}>
                &nbsp; Change Selection
              </button>
            </div>

            <div className="attendance-loaded-divider" />

            <div className="attendance-students-header">
              <div className="students-count-label">Students: <span>{totalElements}</span></div>
              <div className="attendance-actions">
                <button type="button" className="attendance-inline-btn mark-present-btn" onClick={handleUpdateAttendance} disabled={saving || students.length === 0}>
                  &nbsp; Update Attendance
                </button>
                <button
                  type="button"
                  className="attendance-inline-btn primary save-attendance-btn"
                  onClick={handleSaveAttendance}
                  disabled={saving || students.length === 0}
                >
                  {saving ? ' Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>

            <div className="attendance-table-wrap">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Attendance</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const actionState = getStudentActionState(student)

                    return (
                      <tr key={student.id}>
                        <td>{currentPage * 7 + index + 1}</td>
                        <td>{student.rollNo}</td>
                        <td>{student.name}</td>
                        <td>
                          <div className="status-toggle-group">
                            {statusOptions.map(status => (
                              <button
                                key={status}
                                type="button"
                                className={`status-option ${student.status === status ? 'active' : ''}`}
                                onClick={() => handleStatusChange(student.id, status)}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`attendance-action-tick ${actionState.tickClass}`}>{actionState.tick}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="attendance-pagination">
              <div className="attendance-record-summary">
                Showing {totalElements === 0 ? 0 : currentPage * 7 + 1} - {Math.min((currentPage + 1) * 7, totalElements)} of {totalElements} records
              </div>
              {totalPages > 1 && (
                <div className="attendance-page-controls">
                  <button
                    type="button"
                    className="page-btn pagination-nav"
                    disabled={currentPage === 0}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    &nbsp; Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`page-btn ${currentPage === i ? 'active' : ''}`}
                      onClick={() => handlePageChange(i)}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="page-btn pagination-nav"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next&nbsp; 
                  </button>
                </div>
              )}
            </div>
            </>
          ) : (
            <>
            <div className="attendance-header-wrap">
              <div className="attendance-header-row">
                <div className="attendance-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="attendance-icon">
                    <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2.2"/>
                    <path d="M8 3v4M16 3v4M3 10h18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                    <path d="M8 14h3v3H8z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="attendance-header-copy">
                  <div className="attendance-title">Attendance</div>
                  <div className="attendance-subtitle">Take attendance for your class</div>
                </div>
              </div>
            </div>

            <div className="attendance-form-block">
              <label className="attendance-field-label">Attendance Date</label>
              <div className="attendance-input-box attendance-date-box">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="attendance-date-picker"
                  aria-label="Attendance date"
                />
                <div className="attendance-date-text">{formattedDate}</div>
                <span className="field-end-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M8 3v4M16 3v4M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
              </div>
            </div>

            <div className="attendance-row">
              <div className="attendance-form-block attendance-form-half">
                <label className="attendance-field-label">Course</label>
                <div className="attendance-select-box">
                  <select value={course} onChange={(e) => setCourse(e.target.value)} className="attendance-select">
                    <option value="">-- Select Course --</option>
                    {courseOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <span className="field-arrow" aria-hidden="true">▼</span>
                </div>
              </div>

              <div className="attendance-form-block attendance-form-half">
                <label className="attendance-field-label">Division</label>
                <div className="attendance-select-box">
                  <select value={division} onChange={(e) => setDivision(e.target.value)} className="attendance-select">
                    <option value="">-- Select Division --</option>
                    {divisionOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <span className="field-arrow" aria-hidden="true">▼</span>
                </div>
              </div>
            </div>

            <div className="attendance-submit-wrap">
              <button type="button" className="attendance-load-btn" onClick={handleLoadStudents} disabled={loadingStudents}>
                {loadingStudents ? 'Loading Students...' : 'Load Students'}
              </button>
              {attempted && (!course || !division) ? (
                <div className="attendance-load-hint">Please select a course and division to load students.</div>
              ) : null}
              {loadError && <div className="attendance-load-error" role="alert">{loadError}</div>}
            </div>
            </>
          )}
        </div>
      )}

      {/* â”€â”€â”€ ROLE_ADMIN: View Attendance below Take Attendance â”€â”€â”€ */}
      {isAdmin && (
        <div style={{ marginTop: '1.5rem' }}>
          <AttendanceSheet refreshTrigger={refreshTrigger} />
        </div>
      )}

      {toast && (
        <div className={`toast-notification toast-${toast.type}`} role="alert">
          <div className="toast-content">
            <span className="toast-icon">
              {toast.type === 'success' && 'âœ…'}
              {toast.type === 'error' && 'âš ï¸'}
              {toast.type === 'warning' && 'ðŸ””'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
          <button type="button" className="toast-close" onClick={() => setToast(null)} aria-label="Close notification">
            
          </button>
        </div>
      )}
    </div>
  )
}
