import React from 'react'
import { Link } from 'react-router-dom'

export default function StudentRow({ student, onDelete }) {
  // show only numeric part of rollNo (remove any prefix like "ROLL-")
  const rollDigits = String(student.rollNo ?? '').replace(/[^0-9]/g, '');
  const rollDisplay = rollDigits.length ? rollDigits : student.rollNo;

  return (
    <tr className="table-row">
      <td><strong>{rollDisplay}</strong></td>
      <td>{student.name}</td>
      <td><a href={`mailto:${student.email}`}>{student.email}</a></td>
      <td><a href={`tel:${student.mobile || student.phone}`}>{student.mobile || student.phone}</a></td>
      <td>{student.studentClass || student.course}</td>
      <td>{student.dob || '-'}</td>
      <td>
        <div className="btn-group" role="group">
          <Link className="btn btn-sm btn-outline-primary" to={`/edit/${student.id}`}>Edit</Link>
          <button className="btn btn-sm btn-outline-danger" onClick={()=>onDelete(student.id)}>Delete</button>
        </div>
      </td>
    </tr>
  )
}
