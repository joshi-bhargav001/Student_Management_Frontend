import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../api/students'

export default function Footer(){
  const [serverStatus, setServerStatus] = useState('checking')

  useEffect(() => {
    const controller = new AbortController()
    const checkServer = async () => {
      try {
        const res = await fetch(API_BASE, { cache: 'no-store', signal: controller.signal })
        setServerStatus(res.ok ? 'online' : 'offline')
      } catch (error) {
        setServerStatus('offline')
      }
    }

    checkServer()
    return () => controller.abort()
  }, [])

  const statusText = serverStatus === 'online'
    ? 'Online'
    : serverStatus === 'offline'
      ? 'Offline'
      : 'Checking'

  return (
    <footer className="app-footer mt-5">
      <div className="footer-inner">
        <div className="footer-col about">
          <div className="brand-icon">🎓</div>
          <h4>Student Management System</h4>
          <p>A complete solution to manage students, courses, attendance and reports efficiently.</p>
        </div>

        <div className="footer-col links">
          <h5>Quick Links</h5>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/students">Students</Link></li>
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/attendance">Attendance</Link></li>
          </ul>
        </div>

        <div className="footer-col connect">
          <h5>Connect With Us</h5>
          <div className="socials">
            <a href="#" aria-label="github" className="social">GH</a>
            <a href="#" aria-label="linkedin" className="social">in</a>
            <a href="#" aria-label="email" className="social">✉</a>
          </div>
          <blockquote className="quote">Empowering Education Through Technology</blockquote>
        </div>

        <div className="footer-col info">
          <h5>System Info</h5>
          <div className="info-row"><span>Version</span><strong>1.0.0</strong></div>
          <div className="info-row"><span>Server Status</span><strong className={`status ${serverStatus}`}>{statusText}</strong></div>
          <div className="info-row"><span>Last Updated</span><strong>03 June 2026</strong></div>
          <div className="info-row"><span>Environment</span><strong className="env">Development</strong></div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-left">© 2026 Student Management System. All rights reserved.</div>
        <div className="footer-bottom-right">
          <div className="built-with">Built with <span className="heart">♥</span> using</div>
          <div className="tech-list">Java <span className="dot">•</span> Spring Boot <span className="dot">•</span> React <span className="dot">•</span> MySQL</div>
          <div className="byline">Developed by <a href="#">Bhargav Joshi</a></div>
        </div>
      </div>
    </footer>
  )
}
