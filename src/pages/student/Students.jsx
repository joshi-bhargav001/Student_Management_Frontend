import React, { useEffect, useRef, useState } from 'react'
import SearchBar from '../../components/SearchBar'
import { useAuth } from '../../context/AuthContext'
import { useStudents } from '../../context/StudentsProvider'
import StudentTable from '../../components/StudentTable'

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

export default function Students(){
  const { students, pageInfo, loading, error, removeStudent, load } = useStudents()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const hasInitializedSearchRef = useRef(false)

  useEffect(() => {
    if (!hasInitializedSearchRef.current) {
      hasInitializedSearchRef.current = true
      return
    }

    const timeoutId = window.setTimeout(() => {
      load({ page: 0, size: pageInfo.size || 7, keyword: query.trim() })
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [query])

  const total = pageInfo.totalElements ?? students.length
  const [showTable, setShowTable] = useState(true)
  const canManage = user?.role === 'ADMIN'
  const pageSize = pageInfo.size || 7
  const currentPage = pageInfo.page || 0
  const totalPages = pageInfo.totalPages || 0
  const pageItems = buildPaginationItems(currentPage, totalPages)
  const startRecord = total === 0 ? 0 : currentPage * pageSize + 1
  const visibleCount = students.length
  const endRecord = total === 0 ? 0 : startRecord + students.length - 1
  const summaryText = query.trim()
    ? `Showing ${visibleCount} matching record${visibleCount === 1 ? '' : 's'} on this page`
    : `Showing ${startRecord} - ${endRecord} of ${total} records`

  return (
    <div>
      <div className="dashboard-header mb-4">
      </div>

      <div className="row gx-4 gy-3 mb-4">
        <div className="col-md-4 d-flex flex-column align-items-start">
          <div className="stats-card shadow-sm text-center">
            <h6>Total Students</h6>
            <h3 className="stats-value">{total}</h3>
          </div>
        </div>

        <div className="col-md-8">
          <div className="d-flex align-items-center">
            <div className="search-card shadow-sm p-3 flex-grow-1">
              <SearchBar value={query} onChange={setQuery} />
            </div>
            <div className="ms-3">
              <button className="btn btn-outline-primary" onClick={() => setShowTable(s => !s)}>
                {showTable ? 'Hide Student' : 'Show Student'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="alert alert-info">Loading...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {showTable && (
        <>
          <StudentTable students={students} onDelete={async (id)=>{ if(confirm('Delete?')) await removeStudent(id) }} canManage={canManage} />

          <div className="student-footer card shadow-sm border-0 mt-3">
            <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div className="text-muted">
                {summaryText}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Student pagination">
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
