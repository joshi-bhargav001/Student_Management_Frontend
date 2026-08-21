import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import SearchBar from '../../components/SearchBar'
import { loadCourses, searchCourses, deleteCourse } from '../../api/course'

export default function Courses() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [courses, setCourses] = useState([])
  const [pageInfo, setPageInfo] = useState({ page: 0, size: 6, totalPages: 0, totalElements: 0, first: true, last: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const hasInitializedSearchRef = useRef(false)

  async function load(params = {}) {
    setLoading(true)
    setError(null)
    try {
      const data = await loadCourses(params)
      if (data && data.content) {
        setCourses(data.content)
        setPageInfo({
          page: data.number || 0,
          size: data.size || 6,
          totalPages: data.totalPages || 0,
          totalElements: data.totalElements || 0,
          first: data.first ?? true,
          last: data.last ?? true
        })
      } else {
        const arr = Array.isArray(data) ? data : []
        setCourses(arr)
        setPageInfo({ page: 0, size: 6, totalPages: 1, totalElements: arr.length, first: true, last: true })
      }
    } catch (err) {
      setError(err.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load({ page: 0, size: 6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hasInitializedSearchRef.current) {
      hasInitializedSearchRef.current = true
      return
    }
    const id = window.setTimeout(async () => {
      const kw = query.trim()
      if (kw) {
        setLoading(true)
        setError(null)
        try {
          const results = await searchCourses(kw)
          setCourses(results)
          setPageInfo({ page: 0, size: results.length, totalPages: 1, totalElements: results.length, first: true, last: true })
        } catch (err) {
          setError(err.message || 'Failed to search courses')
        } finally {
          setLoading(false)
        }
      } else {
        load({ page: 0, size: pageInfo.size || 6 })
      }
    }, 300)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this course?')) return
    setDeletingId(id)
    try {
      await deleteCourse(id)
      await load({ page: pageInfo.page, size: pageInfo.size, keyword: query.trim() })
      window.alert('Course deleted successfully')
    } catch (err) {
      window.alert(err.message || 'Failed to delete course')
    } finally {
      setDeletingId(null)
    }
  }

  const total = pageInfo.totalElements ?? courses.length
  const [showCourses, setShowCourses] = useState(true)
  const currentPage = pageInfo.page || 0
  const pageSize = pageInfo.size || 6
  const totalPages = pageInfo.totalPages || 0

  return (
    <div>
      <div className="row gx-4 gy-3 mb-4">
        <div className="col-md-4 d-flex flex-column align-items-start">
          <div className="stats-card shadow-sm text-center w-100">
            <h6>TOTAL COURSES</h6>
            <h3 className="stats-value">{total}</h3>
          </div>
        </div>

        <div className="col-md-8">
          <div className="d-flex align-items-center">
            <div className="search-card shadow-sm p-3 flex-grow-1">
              <SearchBar value={query} onChange={setQuery} />
            </div>
            <div className="ms-3">
              <button className="btn btn-outline-primary" style={{ whiteSpace: 'nowrap' }} onClick={() => setShowCourses(s => !s)}>
                {showCourses ? 'Hide Course' : 'Show Course'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {showCourses && !error && (
        <div style={{ position: 'relative', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', minHeight: '400px' }}>
          {loading && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          <div className="row gx-4 gy-4">
            {courses.map(course => (
              <div key={course.id} className="col-md-6 col-lg-4">
                <div className="card shadow-sm border-0 rounded-4 h-100 position-relative overflow-hidden p-4">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="d-flex align-items-center">
                      <div className="brand-icon shadow-sm flex-shrink-0 me-3" style={{ width: 50, height: 50, background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}>
                        🎓
                      </div>
                      <div>
                        <h4 className="fw-bold mb-1">{course.courseName}</h4>
                        <p className="text-muted mb-0">{course.department}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`badge ${course.status === 'ACTIVE' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill px-3 py-2 border ${course.status === 'ACTIVE' ? 'border-success' : 'border-danger'}`}>
                        <span className={`d-inline-block rounded-circle ${course.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'} me-2`} style={{ width: 8, height: 8 }}></span>
                        {course.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <hr className="my-3 text-secondary" style={{ opacity: 0.15 }} />

                  <div className="row mb-4">
                    <div className="col-6 mb-2">
                      <div className="d-flex align-items-center text-muted">
                        <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span className="me-2 text-dark">Duration:</span>
                        <span>{course.duration} {course.duration === 1 ? 'Year' : 'Years'}</span>
                      </div>
                    </div>
                    <div className="col-6 mb-2">
                      <div className="d-flex align-items-center text-muted">
                        <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                        <span className="me-2 text-dark">Semesters:</span>
                        <span>{course.totalSemester}</span>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="d-flex align-items-center text-muted">
                        <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                        <span className="me-2 text-dark">Department:</span>
                        <span>{course.department}</span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && <div className="d-flex gap-2">
                    <Link
                      to={`/edit-course/${course.id}`}
                      state={{ course }}
                      className="btn btn-sm flex-grow-1 rounded-3 py-2 fw-semibold border-1"
                      style={{ color: '#f59e0b', borderColor: '#fcd34d', background: 'rgba(245,158,11,0.02)' }}
                    >
                      <svg className="me-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      Edit
                    </Link>
                    <button
                      className="btn btn-sm flex-grow-1 rounded-3 py-2 fw-semibold course-delete-btn"
                      style={{ color: '#ef4444', borderColor: '#fca5a5', border: '1px solid #fca5a5', background: 'rgba(239,68,68,0.04)' }}
                      onClick={() => handleDelete(course.id)}
                      disabled={deletingId === course.id}
                    >
                      <svg className="me-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      {deletingId === course.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>}
                </div>
              </div>
            ))}
            {courses.length === 0 && (
              <div className="col-12 text-center py-5 text-muted">No courses found.</div>
            )}
          </div>

          {totalPages > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 24px',
              backgroundColor: '#fff',
              borderRadius: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              marginTop: '40px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              color: '#64748b'
            }}>
              <div>
                Showing {total === 0 ? 0 : currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, total)} of {total} records
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => load({ page: currentPage - 1, size: pageSize, keyword: query.trim() })}
                  disabled={pageInfo.first}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: pageInfo.first ? 'none' : '1px solid #e2e8f0',
                    backgroundColor: pageInfo.first ? '#e2e8f0' : '#ffffff',
                    color: pageInfo.first ? '#64748b' : '#475569',
                    cursor: pageInfo.first ? 'not-allowed' : 'pointer',
                    opacity: pageInfo.first ? 0.6 : 1,
                    transition: 'all 0.2s',
                    outline: 'none',
                    fontSize: '0.85rem'
                  }}
                >
                  &lt;&lt; Previous
                </button>

                {(() => {
                  const pages = [];
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPage <= 2) {
                      pages.push(1, 2, 3, 4, '...', totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, '...', currentPage, currentPage + 1, currentPage + 2, '...', totalPages);
                    }
                  }

                  return pages.map((page, index) => {
                    if (page === '...') {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            color: '#64748b',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '10px'
                          }}
                        >
                          ...
                        </span>
                      );
                    }

                    const isActive = page === currentPage + 1;
                    return (
                      <button
                        key={`page-${page}`}
                        onClick={() => load({ page: page - 1, size: pageSize, keyword: query.trim() })}
                        style={{
                          width: '36px',
                          height: '36px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '10px',
                          border: isActive ? 'none' : '1px solid #e2e8f0',
                          backgroundColor: isActive ? '#8b5cf6' : '#ffffff',
                          color: isActive ? '#ffffff' : '#475569',
                          fontWeight: isActive ? '600' : '400',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          outline: 'none',
                          fontSize: '0.85rem'
                        }}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}

                <button
                  onClick={() => load({ page: currentPage + 1, size: pageSize, keyword: query.trim() })}
                  disabled={pageInfo.last}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: pageInfo.last ? 'none' : '1px solid #e2e8f0',
                    backgroundColor: pageInfo.last ? '#e2e8f0' : '#ffffff',
                    color: pageInfo.last ? '#64748b' : '#475569',
                    cursor: pageInfo.last ? 'not-allowed' : 'pointer',
                    opacity: pageInfo.last ? 0.6 : 1,
                    transition: 'all 0.2s',
                    outline: 'none',
                    fontSize: '0.85rem'
                  }}
                >
                  Next &gt;&gt;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
