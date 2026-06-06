import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import AddStudent from './pages/AddStudent'
import EditStudent from './pages/EditStudent'
import { StudentsProvider } from './context/StudentsProvider'

export default function App() {
  return (
    <StudentsProvider>
      <div className="app-shell">
        <div className="container py-4">
          <nav className="navbar navbar-expand-lg navbar-light app-navbar mb-4">
            <div className="container-fluid align-items-center">
              <Link className="navbar-brand brand-logo" to="/">Student App</Link>
              <div className="d-flex">
                <Link className="btn btn-gradient btn-sm" to="/add">Add Student</Link>
              </div>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<Dashboard/>} />
            <Route path="/add" element={<AddStudent/>} />
            <Route path="/edit/:id" element={<EditStudent/>} />
          </Routes>
        </div>
      </div>
    </StudentsProvider>
  )
}
