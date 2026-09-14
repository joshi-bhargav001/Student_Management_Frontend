import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTeacher } from '../../api/teacher'
import { useConfirm } from '../../context/ConfirmDialogContext'

export default function AddTeacher() {
    const nav = useNavigate()
    const confirm = useConfirm()
    // As requested, mimicking AddStudent layout but static for now, and containing all the fields for ADMIN:
    // Name, Email, Number, Address, Gender, Subject, Experience, Salary
    const [form, setForm] = useState({
        name: '',
        email: '',
        number: '',
        address: '',
        gender: '',
        subject: '',
        experience: '',
        salary: ''
    })

    async function submit(e) {
        e.preventDefault()
        try {
            await createTeacher(form)
            await confirm.success('Add Teacher', 'Transaction Completed')
            nav('/teacher')
        } catch (err) {
            alert(err.message || 'Failed to add teacher')
        }
    }

    return (
        <div className="card form-card shadow-sm p-4">
            <h5>Add Teacher</h5>
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
                    <label className="form-label">Number</label>
                    <input type="text" className="form-control" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input type="text" className="form-control" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Gender</label>
                    <select className="form-control" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} required>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input type="text" className="form-control" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Experience (Years)</label>
                    <input type="text" className="form-control" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Salary</label>
                    <input type="text" className="form-control" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} required />
                </div>
                <button className="btn btn-gradient">Add</button>
            </form>
        </div>
    )
}
