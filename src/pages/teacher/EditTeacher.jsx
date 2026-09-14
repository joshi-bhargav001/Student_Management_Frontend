import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { updateTeacher } from '../../api/teacher'
import { useConfirm } from '../../context/ConfirmDialogContext'

const initialForm = {
    name: '',
    email: '',
    number: '',
    address: '',
    gender: '',
    subject: '',
    experience: '',
    salary: ''
}

export default function EditTeacher() {
    const nav = useNavigate()
    const { id } = useParams()
    const location = useLocation()
    const confirm = useConfirm()
    const [form, setForm] = useState(initialForm)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const teacher = location.state?.teacher

        if (!teacher) {
            window.alert('Teacher details were not passed from the list. Please go back and open Edit from the teacher table.')
            nav('/teacher')
            return
        }

        setForm({
            name: teacher.name || '',
            email: teacher.email || '',
            number: teacher.number || '',
            address: teacher.address || '',
            gender: teacher.gender || '',
            subject: teacher.subject || '',
            experience: teacher.experience || '',
            salary: teacher.salary || ''
        })
        setLoading(false)
    }, [id, location.state, nav])

    async function submit(e) {
        e.preventDefault()
        setSaving(true)

        try {
            await updateTeacher(id, form)
            await confirm.success('Edit Teacher', 'Transaction Completed')
            nav('/teacher')
        } catch (err) {
            window.alert(err.message || 'Failed to update teacher')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="alert alert-info">Loading teacher...</div>
    }

    return (
        <div className="card form-card shadow-sm p-4">
            <h5>Edit Teacher</h5>
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
                <div className="d-flex gap-2">
                    <button className="btn btn-gradient" disabled={saving}>
                        {saving ? 'Updating...' : 'Update'}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => nav('/teacher')} disabled={saving}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}
