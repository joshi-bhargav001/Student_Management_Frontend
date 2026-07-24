import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import * as api from '../api/students'
import { useAuth } from './AuthContext'

const StudentsContext = createContext(null)

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
  const lastLoadParamsRef = useRef({ page: 0, size: 7, keyword: '' })

  function normalizeStudent(s) {
    return {
      ...s,
      rollNo: s.rollNo ?? s.rollno ?? s.roll_no ?? s.roll
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
      const data = await api.fetchStudentsPage(nextParams)
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

  return (
    <StudentsContext.Provider value={{ students, pageInfo, loading, error, load, addStudent, editStudent, removeStudent }}>
      {children}
    </StudentsContext.Provider>
  )
}

export const useStudents = () => useContext(StudentsContext)
