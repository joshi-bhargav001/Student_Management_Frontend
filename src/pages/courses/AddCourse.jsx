import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createCourse } from '../../api/course'

export default function AddCourse() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const isAdmin = user?.role === 'ADMIN'
    const [formData, setFormData] = useState({
        courseName: '',
        duration: '',
        totalSemester: '',
        department: '',
        status: 'ACTIVE'
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    if (!isAdmin) {
        return <div className="p-4"><div className="alert alert-danger">Access Denied: Only administrators can add courses.</div></div>
    }

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            await createCourse({
                courseName: formData.courseName,
                duration: formData.duration,
                totalSemester: Number(formData.totalSemester),
                department: formData.department,
                status: formData.status
            })
            window.alert('Course added successfully!')
            navigate('/courses')
        } catch (err) {
            setError(err.message || 'Failed to add course')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="form-card shadow-sm p-4 mt-3 col-lg-8 mx-auto">
                <h4 className="fw-bold mb-1" style={{ color: '#4f46e5' }}>Add Course</h4>
                <p className="text-muted mb-4">Enter the details for the new course</p>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="courseName">Course Name</label>
                        <input
                            className="form-control form-control-lg"
                            id="courseName"
                            name="courseName"
                            placeholder="e.g. Bachelor of Computer Applications"
                            value={formData.courseName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="department">Department / Code</label>
                        <input
                            className="form-control"
                            id="department"
                            name="department"
                            placeholder="e.g. BCA"
                            value={formData.department}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="row mb-3">
                        <div className="col-md-6 mb-3 mb-md-0">
                            <label className="form-label fw-semibold" htmlFor="duration">Duration</label>
                            <input
                                className="form-control"
                                id="duration"
                                name="duration"
                                placeholder="e.g. 3 Years"
                                value={formData.duration}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold" htmlFor="totalSemester">Total Semesters</label>
                            <input
                                type="number"
                                className="form-control"
                                id="totalSemester"
                                name="totalSemester"
                                placeholder="e.g. 6"
                                min="1"
                                value={formData.totalSemester}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-semibold" htmlFor="status">Status</label>
                        <select
                            className="form-select"
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                        </select>
                    </div>

                    <div className="d-flex justify-content-end gap-3 mt-4">
                        <button
                            type="button"
                            className="btn btn-outline-secondary px-4"
                            onClick={() => navigate('/courses')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-gradient px-5"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Course'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
