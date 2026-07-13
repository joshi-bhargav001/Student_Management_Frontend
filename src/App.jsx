import React from 'react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import { StudentsProvider } from './context/StudentsProvider'
import AddStudent from './pages/AddStudent'
import EditStudent from './pages/EditStudent'
import Attendance from './pages/attendance/Attendance'
import AuthPage from './pages/auth/AuthPage'
import Courses from './pages/courses/Courses'
import Dashboard from './pages/dashboard/Dashboard'
import Teacher from './pages/teacher/Teacher'
import Students from './pages/student/Students'

function AppShell() {
  const { user, logout, isAuthenticated } = useAuth()
  const roleLabel = user?.role === 'ADMIN' ? 'Administrator' : 'User'

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout()
    }
  }

  return (
    <div className="app-shell">
      <div className="container py-4">
        {isAuthenticated && (
          <nav className="app-navbar mb-4">
            <div className="app-navbar-inner">
              <div className="app-brand">
                <div className="brand-icon" aria-hidden="true">🎓</div>
                <div>
                  <div className="brand-title">Student Management System</div>
                  <div className="brand-subtitle">Track students, attendance, courses</div>
                </div>
              </div>

              <div className="app-navlinks">
                <NavLink to="/dashboard" className={({ isActive }) => 'app-nav-link' + (isActive ? ' active' : '')}>Dashboard</NavLink>
                <NavLink to="/students" className={({ isActive }) => 'app-nav-link' + (isActive ? ' active' : '')}>Students</NavLink>
                <NavLink to="/courses" className={({ isActive }) => 'app-nav-link' + (isActive ? ' active' : '')}>Courses</NavLink>
                <NavLink to="/attendance" className={({ isActive }) => 'app-nav-link' + (isActive ? ' active' : '')}>Attendance</NavLink>
                <NavLink to="/teacher" className={({ isActive }) => 'app-nav-link' + (isActive ? ' active' : '')}>Teacher</NavLink>
                {user?.role === 'ADMIN' && (
                  <Link className="btn btn-gradient btn-sm add-student-btn" to="/add">Add Student</Link>
                )}
                {user?.role === 'ADMIN' && (
                  <span className="admin-label">{roleLabel}</span>
                )}
              </div>

              <div className="app-header-actions">
                {user?.role === 'ADMIN' && (
                  <button className={`btn btn-sm role-badge role-admin`}>
                    {user?.role === 'ADMIN' ? 'ADMIN' : 'User'}
                  </button>
                )}
                <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>Logout</button>
              </div>
            </div>
          </nav>
        )}

        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/teacher" element={<ProtectedRoute><Teacher /></ProtectedRoute>} />
          <Route path="/add" element={<ProtectedRoute adminOnly><AddStudent /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute adminOnly><EditStudent /></ProtectedRoute>} />
        </Routes>

        {isAuthenticated && <Footer />}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <StudentsProvider>
        <AppShell />
      </StudentsProvider>
    </AuthProvider>
  )
}
