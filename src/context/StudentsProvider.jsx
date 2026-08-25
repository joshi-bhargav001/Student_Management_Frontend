import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import * as api from '../api/students'
import { fetchStudentsByFilter } from '../api/students'
import { useAuth } from './AuthContext'

const StudentsContext = createContext(null)

function isMeaningfulPhotoValue(value) {
  if (value === undefined || value === null) return false

  const normalized = String(value).trim()
  if (!normalized || normalized.toUpperCase() === 'NULL') return false

  return true
}

function normalizePhotoUrl(value) {
  if (!isMeaningfulPhotoValue(value)) return ''
  if (/^https?:\/\//i.test(value)) return value

  const cleaned = String(value).replace(/\\/g, '/')
  if (cleaned.startsWith('/')) return `http://localhost:8080${cleaned}`
  return `http://localhost:8080/${cleaned}`
}

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState([])
  const [pageInfo, setPageInfo] = useState({
    page: 0,
    size: 7,
    totalElements: 0,
    totalPages: 0,
    numberOfElements: 0,
    first: true,
    last: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { token } = useAuth()
  const lastLoadParamsRef = useRef({ page: 0, size: 7, keyword: '', course: '', division: '' })

  function normalizeStudent(s) {
    const savedPhoto = s.photoUrl || s.photo || s.imageUrl || s.profilePhoto || s.profileImage || s.image || s.photoPath || s.fileName || s.profilePic || ''

    return {
      ...s,
      rollNo: s.rollNo ?? s.rollno ?? s.roll_no ?? s.roll,
      photoUrl: normalizePhotoUrl(savedPhoto)
    }
  }

  useEffect(() => {
    if (!token) {
      setStudents([])
      setPageInfo({
        page: 0,
        size: 7,
        totalElements: 0,
        totalPages: 0,
        numberOfElements: 0,
        first: true,
        last: true
      })
      return
    }
    load()
  }, [token])

  async function load(params = {}) {
    const nextParams = {
      ...lastLoadParamsRef.current,
      ...params
    }
    lastLoadParamsRef.current = nextParams

    setLoading(true)
    setError(null)
    try {
      let data
      if (nextParams.course || nextParams.division) {
        // Server-side filter: GET /api/students?course={}&division={}
        data = await fetchStudentsByFilter({
          course: nextParams.course,
          division: nextParams.division,
          page: nextParams.page,
          size: nextParams.size,
          keyword: nextParams.keyword
        })
      } else {
        data = await api.fetchStudentsPage(nextParams)
      }
      const normalized = Array.isArray(data.content) ? data.content.map(normalizeStudent) : []
      setStudents(normalized)
      setPageInfo(data.pageInfo)
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  async function addStudent(s) {
    const created = await api.createStudent(s)
    const norm = normalizeStudent(created)
    await load(lastLoadParamsRef.current)
    return norm
  }

  async function editStudent(id, s) {
    const updated = await api.updateStudent(id, s)
    const norm = normalizeStudent(updated)
    await load(lastLoadParamsRef.current)
    return norm
  }

  async function removeStudent(id) {
    await api.deleteStudent(id)
    await load(lastLoadParamsRef.current)
  }

  async function uploadPhoto(id, file) {
    const response = await api.uploadStudentPhoto(id, file)

    await load(lastLoadParamsRef.current)

    if (response && typeof response === 'object') {
      const normalized = normalizeStudent(response)
      setStudents(current =>
        current.map(student => (student.id === id ? { ...student, ...normalized } : student))
      )
      return normalized
    }

    return response
  }

  async function removePhoto(id) {
    await api.deleteStudentPhoto(id)
    await load(lastLoadParamsRef.current)
    setStudents(current =>
      current.map(student => (student.id === id ? { ...student, photoUrl: '' } : student))
    )
  }

  return (
    <StudentsContext.Provider value={{ students, pageInfo, loading, error, load, addStudent, editStudent, removeStudent, uploadPhoto, removePhoto, lastLoadParams: lastLoadParamsRef.current }}>
      {children}
    </StudentsContext.Provider>
  )
}

export const useStudents = () => useContext(StudentsContext)
