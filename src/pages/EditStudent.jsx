import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStudents } from '../context/StudentsProvider'
import * as api from '../api/students'
import { fetchCoursesDropdown } from '../api/course'
import { useConfirm } from '../context/ConfirmDialogContext'

export default function EditStudent() {
  const { id } = useParams()
  const { editStudent } = useStudents()
  const confirm = useConfirm()
  const nav = useNavigate()
  const [form, setForm] = useState(null)
  const [courseOptions, setCourseOptions] = useState([])
  const [divisionOptions, setDivisionOptions] = useState([])
  // Load student data
  useEffect(() => {
    api.fetchStudent(id).then(s => setForm({
      ...s,
      division: s.division ?? '',
      phone: s.mobile || s.phone,
      studentClass: s.studentClass || s.course
    }))
  }, [id])

  // Load course dropdown options on mount
  useEffect(() => {
    fetchCoursesDropdown()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.content ?? [])
        const names = arr.map(c =>
          typeof c === 'string' ? c : (c.courseName || c.name || c.course || '')
        ).filter(Boolean).sort()
        setCourseOptions(names)
      })
      .catch(err => console.error('[EditStudent] Failed to load courses:', err.message))

    api.fetchDivisions()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.content ?? [])
        const names = arr.map(d =>
          typeof d === 'string' ? d : (d.divisionName || d.name || d.division || '')
        ).filter(Boolean).sort()
        setDivisionOptions(names)
      })
      .catch(err => console.error('[EditStudent] Failed to load divisions:', err.message))
  }, [])

  async function submit(e) {
    e.preventDefault()
    const payload = { ...form, mobile: form.phone, course: form.studentClass }
    await editStudent(id, payload)
    await confirm.success('Edit Student', 'Transaction Completed')
    nav('/students')
  }

  if (!form) return <div className="alert alert-info">Loading...</div>

  return (
    <div className="card form-card shadow-sm p-4">
      <h5>Edit Student</h5>
      <form onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone</label>
          <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Division</label>
          <select
            className="form-control"
            value={form.division || ''}
            onChange={e => setForm({ ...form, division: e.target.value })}
            required
          >
            <option value="">-- Select Division --</option>
            {divisionOptions.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Course</label>
          <select
            className="form-control"
            value={form.studentClass || ''}
            onChange={e => setForm({ ...form, studentClass: e.target.value })}
            required
          >
            <option value="">-- Select Course --</option>
            {courseOptions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-gradient">Save</button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => nav('/students')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
