import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStudents } from '../context/StudentsProvider'
import * as api from '../api/students'

export default function EditStudent(){
  const { id } = useParams()
  const { editStudent } = useStudents()
  const nav = useNavigate()
  const [form, setForm] = useState(null)

  useEffect(()=>{
    api.fetchStudent(id).then(s=> setForm({
      ...s,
      rollNo: s.rollNo ?? s.rollno ?? s.roll_no ?? s.roll,
      phone: s.mobile || s.phone,
      studentClass: s.studentClass || s.course
    }))
  },[id])

  async function submit(e){
    e.preventDefault()
    const payload = { ...form, mobile: form.phone, course: form.studentClass }
    await editStudent(id, payload)
    nav('/')
  }

  if(!form) return <div className="alert alert-info">Loading...</div>

  return (
    <div className="card form-card shadow-sm p-4">
      <h5>Edit Student</h5>
      <form onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input className="form-control" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Roll No</label>
          <input className="form-control" value={form.rollNo} onChange={e=>setForm({...form, rollNo:e.target.value})} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone</label>
          <input className="form-control" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Class</label>
          <input className="form-control" value={form.studentClass} onChange={e=>setForm({...form, studentClass:e.target.value})} required />
        </div>
        <button className="btn btn-gradient">Save</button>
      </form>
    </div>
  )
}
