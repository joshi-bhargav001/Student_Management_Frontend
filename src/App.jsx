import React from 'react'
import { Routes, Route, Link, NavLink } from 'react-router-dom'
import Home from './pages/home/Home'
import Dashboard from './pages/dashboard/Dashboard'
import Students from './pages/student/Students'
import Courses from './pages/courses/Courses'
import Attendance from './pages/attendance/Attendance'
import Teacher from './pages/teacher/Teacher'
import AddStudent from './pages/AddStudent'
import EditStudent from './pages/EditStudent'
import { StudentsProvider } from './context/StudentsProvider'

export default function App() {
  return (
    <StudentsProvider>
      <div className="app-shell">
        <div className="container py-4">
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
                <NavLink to="/" className={({isActive}) => "app-nav-link" + (isActive ? " active" : "")} end>Home</NavLink>
                <NavLink to="/dashboard" className={({isActive}) => "app-nav-link" + (isActive ? " active" : "")}>Dashboard</NavLink>
                <NavLink to="/students" className={({isActive}) => "app-nav-link" + (isActive ? " active" : "")}>Students</NavLink>
                <NavLink to="/courses" className={({isActive}) => "app-nav-link" + (isActive ? " active" : "")}>Courses</NavLink>
                <NavLink to="/attendance" className={({isActive}) => "app-nav-link" + (isActive ? " active" : "")}>Attendance</NavLink>
                <NavLink to="/teacher" className={({isActive}) => "app-nav-link" + (isActive ? " active" : "")}>Teacher</NavLink>
              </div>

              <div className="app-header-actions">
                <Link className="btn btn-gradient btn-sm add-student-btn" to="/add">Add Student</Link>
                {/* notification icon removed per request */}
                <div className="user-pill">
                  <div className="avatar">A</div>
                  <div className="user-name">Admin</div>
                </div>
              </div>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/dashboard" element={<Dashboard/>} />
            <Route path="/students" element={<Students/>} />
            <Route path="/courses" element={<Courses/>} />
            <Route path="/attendance" element={<Attendance/>} />
            <Route path="/teacher" element={<Teacher/>} />
            <Route path="/add" element={<AddStudent/>} />
            <Route path="/edit/:id" element={<EditStudent/>} />
          </Routes>
        </div>
      </div>
    </StudentsProvider>
  )
}
