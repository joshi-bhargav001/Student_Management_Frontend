import React, { useMemo, useState } from 'react'
import { useStudents } from '../context/StudentsProvider'
import SearchBar from '../components/SearchBar'
import StudentTable from '../components/StudentTable'

export default function Dashboard(){
  const { students, loading, error, removeStudent } = useStudents()
  const [query, setQuery] = useState('')

  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(s => [s.name, s.email, s.rollNo, s.course, s.mobile, s.studentClass].some(f => String(f||'').toLowerCase().includes(q)))
  }, [students, query])

  const total = students.length

  return (
    <div>
      <div className="dashboard-header mb-4">
        <h2>Manage students with ease</h2>
        <p className="text-secondary">Search, edit, and track student records in one colorful dashboard.</p>
      </div>

      <div className="row gx-4 gy-3 mb-4">
        <div className="col-md-4">
          <div className="stats-card shadow-sm">
            <h6>Total Students</h6>
            <h3>{total}</h3>
          </div>
        </div>
        <div className="col-md-8">
          <div className="search-card shadow-sm p-3">
            <SearchBar value={query} onChange={setQuery} />
          </div>
        </div>
      </div>

      {loading && <div className="alert alert-info">Loading...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <StudentTable students={filtered} onDelete={async (id)=>{ if(confirm('Delete?')) await removeStudent(id) }} />
    </div>
  )
}
