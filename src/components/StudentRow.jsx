import React from 'react'
import { Link } from 'react-router-dom'

export default function StudentRow({ student, onDelete, canManage }) {
  const rollDigits = String(student.rollNo ?? '').replace(/[^0-9]/g, '');
  const rollDisplay = rollDigits.length ? rollDigits : student.rollNo;

  return (
    <tr className="table-row">
      <td><strong>{rollDisplay}</strong></td>
      <td>{student.name}</td>
      <td><a className="student-contact-link" href={`mailto:${student.email}`}>{student.email}</a></td>
      <td><a className="student-contact-link" href={`tel:${student.mobile || student.phone}`}>{student.mobile || student.phone}</a></td>
      <td>{student.studentClass || student.course}</td>
      <td>{student.dob || '-'}</td>
      <td>
        {canManage ? (
          <div className="btn-group" role="group">
            <Link className="btn btn-sm btn-outline-primary" to={`/edit/${student.id}`}>Edit</Link>
            <button className="btn btn-sm btn-outline-danger" onClick={()=>onDelete(student.id)}>Delete</button>
          </div>
        ) : (
          <span className="text-muted">View only</span>
        )}
      </td>
    </tr>
  )
}
