import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudents } from '../context/StudentsProvider'

export default function AddStudent(){
  const { addStudent } = useStudents()
  const nav = useNavigate()
  const [form, setForm] = useState({name:'', rollNo:'', email:'', phone:'', studentClass:'', dob:''})

  async function submit(e){
    e.preventDefault()
    const payload = { ...form, mobile: form.phone, course: form.studentClass }
    await addStudent(payload)
    nav('/')
  }

  return (
    <div className="card form-card shadow-sm p-4">
      <h5>Add Student</h5>
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
        <button className="btn btn-gradient">Add</button>
      </form>
    </div>
  )
}
