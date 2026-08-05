import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { Link } from 'react-router-dom'
import { fetchStudentPhotoBlob } from '../api/students'
import { useStudents } from '../context/StudentsProvider'

export default function StudentRow({ student, onDelete, canManage }) {
  const rollDigits = String(student.rollNo ?? '').replace(/[^0-9]/g, '')
  const rollDisplay = rollDigits.length ? rollDigits : student.rollNo
  const inputId = `student-photo-${student.id}`
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showPhotoPreview, setShowPhotoPreview] = useState(false)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const [photoKey, setPhotoKey] = useState(0)
  const { uploadPhoto, removePhoto } = useStudents()
  // hasSavedPhoto is true when a blob URL was successfully fetched from the photo API
  const hasSavedPhoto = Boolean(photoPreviewUrl) && !photoLoadFailed

  useEffect(() => {
    let isMounted = true
    let objectUrl = ''

    setPhotoLoadFailed(false)
    setShowPhotoPreview(false)
    setPhotoPreviewUrl('')

    // Always attempt to fetch the photo — the list API doesn't return photo data,
    // so we rely entirely on /api/students/{id}/photo for every student
    if (!student.id) return () => { }

    fetchStudentPhotoBlob(student.id)
      .then(url => {
        if (!url) {
          if (isMounted) {
            setPhotoLoadFailed(true)
            setPhotoPreviewUrl('')
          }
          return
        }

        if (!isMounted) {
          URL.revokeObjectURL(url)
          return
        }

        objectUrl = url
        setPhotoPreviewUrl(url)
      })
      .catch(() => {
        if (isMounted) {
          setPhotoLoadFailed(true)
          setPhotoPreviewUrl('')
        }
      })

    return () => {
      isMounted = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [student.id, photoKey])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showPhotoPreview) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showPhotoPreview])

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      await uploadPhoto(student.id, file)
      setPhotoLoadFailed(false)
      setPhotoKey(k => k + 1) // re-trigger photo fetch to show new photo
    } catch (error) {
      setPhotoLoadFailed(false)
      window.alert(error.message || 'Failed to upload student photo')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleDeletePhoto() {
    if (!window.confirm('Are you sure you want to delete this photo?')) return
    try {
      await removePhoto(student.id)
      setPhotoPreviewUrl('')
      setShowPhotoPreview(false)
      setPhotoLoadFailed(false)
      setPhotoKey(k => k + 1)
    } catch (error) {
      window.alert(error.message || 'Failed to delete photo')
    }
  }

  return (
    <tr className="table-row">
      <td><strong>{rollDisplay}</strong></td>
      <td>{student.name}</td>
      <td><a className="student-contact-link" href={`mailto:${student.email}`}>{student.email}</a></td>
      <td><a className="student-contact-link" href={`tel:${student.mobile || student.phone}`}>{student.mobile || student.phone}</a></td>
      <td>{student.studentClass || student.course}</td>
      <td>
        {hasSavedPhoto ? (
          <>
            <button
              type="button"
              className="student-photo-picker student-photo-preview-button"
              onClick={() => setShowPhotoPreview(true)}
              aria-label={`View photo for ${student.name || 'student'}`}
            >
              <span className="student-photo-camera-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img">
                  <path d="M9 3.75h6l1.1 1.75h3.15A2.25 2.25 0 0 1 21.5 7.75v9A2.25 2.25 0 0 1 19.25 19h-14.5A2.25 2.25 0 0 1 2.5 16.75v-9A2.25 2.25 0 0 1 4.75 5.5h3.15L9 3.75Zm3 3.5a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5Zm0 1.5a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5Z" fill="currentColor" />
                </svg>
              </span>
            </button>

            {showPhotoPreview && ReactDOM.createPortal(
              <div className="student-photo-modal" onClick={() => setShowPhotoPreview(false)}>
                <div className="student-photo-modal-content" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    className="student-photo-close-button"
                    onClick={() => setShowPhotoPreview(false)}
                    aria-label="Close photo preview"
                  >
                    &times;
                  </button>
                  <img
                    className="student-photo-modal-image"
                    src={photoPreviewUrl}
                    alt={`${student.name || 'Student'} photo`}
                    onError={() => {
                      setPhotoLoadFailed(true)
                      setShowPhotoPreview(false)
                    }}
                  />
                  {canManage && (
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleDeletePhoto}
                      >
                        Delete Photo
                      </button>
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )}
          </>
        ) : canManage ? (
          <label className="student-photo-picker" htmlFor={inputId} aria-label={`Select photo for ${student.name || 'student'}`}>
            <input
              id={inputId}
              className="student-photo-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={uploading}
            />
            {uploading ? (
              <span className="student-photo-uploading">...</span>
            ) : (
              <span className="student-photo-placeholder" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img">
                  <path d="M7 2.75h7.69c.6 0 1.17.24 1.6.66l3.3 3.3c.42.43.66 1 .66 1.6V18.5A2.75 2.75 0 0 1 17.5 21.25h-11A2.75 2.75 0 0 1 3.75 18.5v-13A2.75 2.75 0 0 1 6.5 2.75H7Zm0 1.5a1.25 1.25 0 0 0-1.25 1.25v13c0 .69.56 1.25 1.25 1.25h11c.69 0 1.25-.56 1.25-1.25V9.25h-3.5a1.75 1.75 0 0 1-1.75-1.75V4.25H7Zm8.5 1.06V7.5c0 .14.11.25.25.25h2.19l-2.44-2.44Zm-2.25 4.69a.75.75 0 0 1 .75-.75h.75V8.5a.75.75 0 0 1 1.5 0v2.25h2.25a.75.75 0 0 1 0 1.5H16.5v2.25a.75.75 0 0 1-1.5 0V12.5h-2.25a.75.75 0 0 1-.75-.75Z" fill="currentColor" />
                </svg>
              </span>
            )}
          </label>
        ) : (
          <div className="student-photo-picker" style={{ cursor: 'default', opacity: 0.6 }} aria-label="No photo available">
            <span className="student-photo-placeholder" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </span>
          </div>
        )}
      </td>
      <td>
        {canManage ? (
          <div className="btn-group" role="group">
            <Link className="btn btn-sm btn-outline-primary" to={`/edit/${student.id}`}>Edit</Link>
            <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(student.id)}>Delete</button>
          </div>
        ) : (
          <span className="text-muted">View only</span>
        )}
      </td>
    </tr>
  )
}
