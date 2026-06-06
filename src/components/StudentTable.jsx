import React from 'react'
import StudentRow from './StudentRow'

export default function StudentTable({ students, onDelete }) {
  return (
    <div className="table-responsive shadow-sm table-card">
      <table className="table table-sm table-hover align-middle">
        <thead>
          <tr>
            <th>Roll</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Class</th>
            <th>DOB</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length===0 ? (
            <tr><td colSpan="7" className="text-center text-muted py-5">No students found.</td></tr>
          ) : students.map(s => (
            <StudentRow key={s.id} student={s} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
