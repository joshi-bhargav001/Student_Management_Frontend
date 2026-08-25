import React, { useEffect, useRef, useState } from 'react'
import SearchBar from '../../components/SearchBar'
import { useAuth } from '../../context/AuthContext'
import { useStudents } from '../../context/StudentsProvider'
import StudentTable from '../../components/StudentTable'
import { fetchCoursesDropdown } from '../../api/course'
import { loadCourses } from '../../api/course'
import { fetchDivisions } from '../../api/students'
import { useConfirm } from '../../context/ConfirmDialogContext'

function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 1) return []

  const items = []
  const lastPage = totalPages - 1
  const visible = new Set([0, lastPage, currentPage - 1, currentPage, currentPage + 1])

  for (let page = 0; page < totalPages; page += 1) {
    if (!visible.has(page)) continue

    const prev = items[items.length - 1]
    if (typeof prev === 'number' && page - prev > 1) {
      items.push('...')
    }

    items.push(page)
  }

  return items
}

export default function Students() {
  const { students, pageInfo, loading, error, removeStudent, load, lastLoadParams } = useStudents()
  const { user } = useAuth()
  const confirm = useConfirm()
  const [query, setQuery] = useState(lastLoadParams?.keyword || '')
  const [selectedCourse, setSelectedCourse] = useState(lastLoadParams?.course || '')
  const [selectedDivision, setSelectedDivision] = useState(lastLoadParams?.division || '')
  const [allCourses, setAllCourses] = useState([])
  const [allDivisions, setAllDivisions] = useState([])
  const prevQueryRef = useRef(query)

  // Fetch all course names and divisions once on mount so the dropdown never shrinks
  useEffect(() => {
    const extractNames = (data) => {
      const arr = Array.isArray(data) ? data : (data.content ?? data.data ?? [])
      return arr.map(c =>
        typeof c === 'string' ? c : (c.courseName || c.name || c.course || '')
      ).filter(Boolean).sort()
    }

    fetchCoursesDropdown()
      .then(data => {
        const names = extractNames(data)
        if (names.length > 0) {
          setAllCourses(names)
        } else {
          // Fallback: empty result — try regular pages endpoint
          return loadCourses({ page: 0, size: 100 }).then(d => setAllCourses(extractNames(d)))
        }
      })
      .catch(err => {
        console.error('[Students] fetchCoursesDropdown failed:', err.message)
        // Fallback to regular course pages API
        loadCourses({ page: 0, size: 100 })
          .then(d => setAllCourses(extractNames(d)))
          .catch(e => console.error('[Students] loadCourses fallback also failed:', e.message))
      })

    fetchDivisions()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.content ?? data.data ?? [])
        setAllDivisions(arr.map(d => typeof d === 'string' ? d : (d.divisionName || d.name || d.division || '')).filter(Boolean).sort())
      })
      .catch(err => {
        console.error('[Students] fetchDivisions failed:', err.message)
      })
  }, [])

  // Preserve scroll position so we don't jump to top when returning from Edit page
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('studentsListScrollY')
    if (savedScroll) {
      // Need a tiny delay for the DOM to render the table before scrolling
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll, 10)), 0)
    }

    const handleScroll = () => {
      sessionStorage.setItem('studentsListScrollY', window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (query === prevQueryRef.current) return
    prevQueryRef.current = query

    const timeoutId = window.setTimeout(() => {
      load({ page: 0, size: pageInfo.size || 7, keyword: query.trim(), course: selectedCourse, division: selectedDivision })
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [query])

  // When selectedCourse changes: fetch from server with course filter (reset division)
  function handleCourseChange(e) {
    const course = e.target.value
    setSelectedCourse(course)
    setSelectedDivision('')
    load({ page: 0, size: pageInfo.size || 7, keyword: query.trim(), course, division: '' })
  }

  // When selectedDivision changes: fetch from server with both filters
  function handleDivisionChange(e) {
    const division = e.target.value
    setSelectedDivision(division)
    load({ page: 0, size: pageInfo.size || 7, keyword: query.trim(), course: selectedCourse, division })
  }

  const total = pageInfo.totalElements ?? students.length
  const canManage = user?.role === 'ADMIN'
  const pageSize = pageInfo.size || 7
  const currentPage = pageInfo.page || 0
  const totalPages = pageInfo.totalPages || 0
  const pageItems = buildPaginationItems(currentPage, totalPages)
  // Use fetched allCourses for the dropdown; fall back to student-derived list if not loaded yet
  const courses = allCourses.length > 0
    ? allCourses
    : [...new Set(students.map(s => s.course || s.studentClass).filter(Boolean))].sort()
  // Use fetched allDivisions for dropdown; fall back to derived list if not loaded yet
  const divisions = allDivisions.length > 0
    ? allDivisions
    : [...new Set(
      students
        .filter(s => !selectedCourse || (s.course || s.studentClass) === selectedCourse)
        .map(s => s.division)
        .filter(Boolean)
    )].sort()
  // With server-side filtering, students returned are already filtered
  const filteredStudents = students
  const startRecord = total === 0 ? 0 : currentPage * pageSize + 1
  const visibleCount = filteredStudents.length
  const endRecord = total === 0 ? 0 : startRecord + visibleCount - 1
  const hasFilters = query.trim() || selectedCourse || selectedDivision
  const summaryText = hasFilters
    ? `Showing ${visibleCount} matching record${visibleCount === 1 ? '' : 's'} on this page`
    : `Showing ${startRecord} - ${endRecord} of ${total} records`

  return (
    <div>
      <div className="dashboard-header mb-4">
      </div>

      <div className="row gx-4 gy-3 mb-4 align-items-stretch">
        <div className="col-md-4 d-flex flex-column align-items-start">
          <div className="stats-card shadow-sm text-center">
            <h6>Total Students</h6>
            <h3 className="stats-value">{total}</h3>
          </div>
        </div>

        <div className="col-md-8">
          <div className="student-filter-card shadow-sm">
            <div className="student-filter-field">
              <label htmlFor="student-course-filter">Course:</label>
              <select id="student-course-filter" value={selectedCourse} onChange={handleCourseChange}>
                <option value="">All Courses</option>
                {courses.map(course => <option key={course} value={course}>{course}</option>)}
              </select>
            </div>
            <span className="student-filter-divider" aria-hidden="true" />
            <div className="student-filter-field">
              <label htmlFor="student-division-filter">Division:</label>
              <select id="student-division-filter" value={selectedDivision} onChange={handleDivisionChange}>
                <option value="">All Divisions</option>
                {divisions.map(division => <option key={division} value={division}>{division}</option>)}
              </select>
            </div>
            <div className="student-filter-search">
              <SearchBar value={query} onChange={setQuery} />
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="alert alert-info">Loading...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <>
        <StudentTable students={filteredStudents} onDelete={(id) => {
          confirm({
            title: 'Delete Student?',
            message: 'Are you sure you want to delete this student?\nThis action cannot be undone.',
            confirmText: 'Delete',
            successMessage: 'Transaction Successful',
            onConfirm: async () => {
              await removeStudent(id)
            }
          }).catch(console.error)
        }} canManage={canManage} />

        <div className="student-footer card shadow-sm border-0 mt-3">
          <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="text-muted">
              {summaryText}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Student pagination">
                <ul className="pagination pagination-sm mb-0 student-pagination">
                  <li className={`page-item${pageInfo.first ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => load({ page: currentPage - 1, size: pageSize, keyword: query.trim(), course: selectedCourse, division: selectedDivision })} disabled={pageInfo.first}>
                      &lt;&lt; Previous
                    </button>
                  </li>

                  {pageItems.map((item, index) => (
                    item === '...'
                      ? <li className="page-item disabled" key={`ellipsis-${index}`}><span className="page-link">...</span></li>
                      : <li className={`page-item${item === currentPage ? ' active' : ''}`} key={item}>
                        <button className="page-link" onClick={() => load({ page: item, size: pageSize, keyword: query.trim(), course: selectedCourse, division: selectedDivision })}>
                          {item + 1}
                        </button>
                      </li>
                  ))}

                  <li className={`page-item${pageInfo.last ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => load({ page: currentPage + 1, size: pageSize, keyword: query.trim(), course: selectedCourse, division: selectedDivision })} disabled={pageInfo.last}>
                      Next &gt;&gt;
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </>
    </div>
  )
}
