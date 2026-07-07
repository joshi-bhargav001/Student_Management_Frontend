import React, { useMemo, useState } from 'react'
import SearchBar from '../../components/SearchBar'
import { useStudents } from '../../context/StudentsProvider'
import StudentTable from '../../components/StudentTable'
// import StudentRow from '../../components/StudentRow'

export default function Students(){
  const { students, loading, error, removeStudent } = useStudents()
  const [query, setQuery] = useState('')

  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(s => [s.name, s.email, s.rollNo, s.course, s.mobile, s.studentClass].some(f => String(f||'').toLowerCase().includes(q)))
  }, [students, query])

  const total = students.length
  const [showTable, setShowTable] = useState(true)

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
        <StudentTable students={filtered} onDelete={async (id)=>{ if(confirm('Delete?')) await removeStudent(id) }} />
      )}
    </div>
  )
}
