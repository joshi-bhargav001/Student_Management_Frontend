import React, { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../api/students'

const StudentsContext = createContext(null)

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function normalizeStudent(s) {
    return {
      ...s,
      rollNo: s.rollNo ?? s.rollno ?? s.roll_no ?? s.roll
    }
  }

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await api.fetchStudents()
      const normalized = Array.isArray(data) ? data.map(normalizeStudent) : []
      setStudents(normalized)
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  async function addStudent(s) {
    const created = await api.createStudent(s)
    const norm = normalizeStudent(created)
    setStudents(prev => [...prev, norm])
    return norm
  }

  async function editStudent(id, s) {
    const updated = await api.updateStudent(id, s)
    const norm = normalizeStudent(updated)
    setStudents(prev => prev.map(p => p.id===norm.id? norm: p))
    return norm
  }

  async function removeStudent(id) {
    await api.deleteStudent(id)
    setStudents(prev => prev.filter(p => p.id !== id))
  }

  return (
    <StudentsContext.Provider value={{ students, loading, error, load, addStudent, editStudent, removeStudent }}>
      {children}
    </StudentsContext.Provider>
  )
}

export const useStudents = () => useContext(StudentsContext)
