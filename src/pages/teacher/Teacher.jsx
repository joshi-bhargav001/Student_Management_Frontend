import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import SearchBar from '../../components/SearchBar'
import { deleteTeacher, loadTeachers } from '../../api/teacher'

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

export default function Teacher() {
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN'

  const [teachers, setTeachers] = useState([])
  const [pageInfo, setPageInfo] = useState({ page: 0, size: 7, totalPages: 0, totalElements: 0, first: true, last: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [showTable, setShowTable] = useState(true)
  const [deletingTeacherId, setDeletingTeacherId] = useState(null)
  const hasInitializedSearchRef = useRef(false)

  async function load(params = {}) {
    setLoading(true)
    setError(null)
    try {
      const data = await loadTeachers(params, canManage)
      if (data && data.content) {
        setTeachers(data.content)
        setPageInfo({
          page: data.number || 0,
          size: data.size || 7,
          totalPages: data.totalPages || 0,
          totalElements: data.totalElements || 0,
          first: data.first ?? true,
          last: data.last ?? true
        })
      } else {
        // Fallback for search which might return an array instead of a page object
        setTeachers(Array.isArray(data) ? data : [])
        setPageInfo({
          page: 0, size: 7, totalPages: 1, totalElements: (data || []).length, first: true, last: true
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch teachers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load({ page: 0, size: 7 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage])

  useEffect(() => {
    if (!hasInitializedSearchRef.current) {
      hasInitializedSearchRef.current = true
      return
    }

    const timeoutId = window.setTimeout(() => {
      load({ page: 0, size: pageInfo.size || 7, keyword: query.trim() })
    }, 300)

    return () => window.clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  async function handleDeleteTeacher(teacherId) {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return

    setDeletingTeacherId(teacherId)
    try {
      await deleteTeacher(teacherId)
      await load({ page: currentPage, size: pageSize, keyword: query.trim() })
      window.alert('Teacher deleted successfully')
    } catch (err) {
      window.alert(err.message || 'Failed to delete teacher')
    } finally {
      setDeletingTeacherId(null)
    }
  }

  const total = pageInfo.totalElements ?? teachers.length

  const pageSize = pageInfo.size || 7
  const currentPage = pageInfo.page || 0
  const totalPages = pageInfo.totalPages || 0
  const pageItems = buildPaginationItems(currentPage, totalPages)
  const startRecord = total === 0 ? 0 : currentPage * pageSize + 1
  const visibleCount = teachers.length
  const endRecord = total === 0 ? 0 : startRecord + teachers.length - 1
  const summaryText = query.trim()
    ? `Showing ${visibleCount} matching record${visibleCount === 1 ? '' : 's'} on this page`
    : `Showing ${startRecord} - ${endRecord} of ${total} records`

  return (
    <div>
      <div className="dashboard-header mb-4">
        <h2>Teachers</h2>
        <p>Manage and view your teaching staff</p>
      </div>

      <div className="row gx-4 gy-3 mb-4">
        <div className="col-md-4 d-flex flex-column align-items-start">
          <div className="stats-card shadow-sm text-center">
            <h6>Total Teachers</h6>
            <h3 className="stats-value">{total}</h3>
          </div>
        </div>

        <div className="col-md-8">
          <div className="d-flex align-items-center">
            <div className="search-card shadow-sm p-3 flex-grow-1">
              <SearchBar value={query} onChange={setQuery} placeholder="Search teachers..." />
            </div>
            <div className="ms-3">
              <button className="btn btn-outline-primary" onClick={() => setShowTable(s => !s)}>
                {showTable ? 'Hide Teachers' : 'Show Teachers'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="alert alert-info mt-3">Loading teachers...</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {!loading && !error && showTable && (
        <>
          <div className="table-card shadow-sm p-0 overflow-hidden mt-3">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Name</th>
                    <th>Email</th>
                    {canManage && <th>Number</th>}
                    {canManage && <th>Address</th>}
                    <th>Gender</th>
                    <th>Subject</th>
                    <th>Experience</th>
                    {canManage && <th>Salary</th>}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher, idx) => (
                    <tr key={teacher.id || idx} className="table-row">
                      <td><strong>{teacher.no || teacher.id}</strong></td>
                      <td>{teacher.name}</td>
                      <td>
                        <a className="student-contact-link" href={`mailto:${teacher.email}`}>
                          {teacher.email}
                        </a>
                      </td>
                      {canManage && (
                        <td>
                          <a className="student-contact-link" href={`tel:${teacher.number}`}>
                            {teacher.number}
                          </a>
                        </td>
                      )}
                      {canManage && <td>{teacher.address}</td>}
                      <td>{teacher.gender}</td>
                      <td>{teacher.subject}</td>
                      <td>{teacher.experience}</td>
                      {canManage && <td>{teacher.salary}</td>}
                      <td>
                        {canManage ? (
                          <div className="btn-group" role="group">
                            <Link
                              className="btn btn-sm btn-outline-primary"
                              to={`/edit-teacher/${teacher.id}`}
                              state={{ teacher }}
                            >
                              Edit
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteTeacher(teacher.id)}
                              disabled={deletingTeacherId === teacher.id}
                            >
                              {deletingTeacherId === teacher.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted">View only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan="10" className="text-center py-4 text-muted">
                        No teachers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="student-footer card shadow-sm border-0 mt-3">
            <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div className="text-muted">
                {summaryText}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Teacher pagination">
                  <ul className="pagination pagination-sm mb-0 student-pagination">
                    <li className={`page-item${pageInfo.first ? ' disabled' : ''}`}>
                      <button className="page-link" onClick={() => load({ page: currentPage - 1, size: pageSize, keyword: query.trim() })} disabled={pageInfo.first}>
                        &lt;&lt; Previous
                      </button>
                    </li>

                    {pageItems.map((item, index) => (
                      item === '...'
                        ? <li className="page-item disabled" key={`ellipsis-${index}`}><span className="page-link">...</span></li>
                        : <li className={`page-item${item === currentPage ? ' active' : ''}`} key={item}>
                          <button className="page-link" onClick={() => load({ page: item, size: pageSize, keyword: query.trim() })}>
                            {item + 1}
                          </button>
                        </li>
                    ))}

                    <li className={`page-item${pageInfo.last ? ' disabled' : ''}`}>
                      <button className="page-link" onClick={() => load({ page: currentPage + 1, size: pageSize, keyword: query.trim() })} disabled={pageInfo.last}>
                        Next &gt;&gt;
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
