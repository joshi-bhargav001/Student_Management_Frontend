import React, { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../api/students'

const StudentsContext = createContext(null)

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await api.fetchStudents()
      setStudents(data)
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  async function addStudent(s) {
    const created = await api.createStudent(s)
    setStudents(prev => [...prev, created])
    return created
  }

  async function editStudent(id, s) {
    const updated = await api.updateStudent(id, s)
    setStudents(prev => prev.map(p => p.id===updated.id? updated: p))
    return updated
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
