import React, { useEffect, useState } from 'react'
import { fetchDashboard } from '../../api/dashboard'

// ─── helpers ────────────────────────────────────────────────────────────────
function shortDate(isoDate) {
  const d = new Date(isoDate)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Donut chart (pure SVG) ──────────────────────────────────────────────────
function DonutChart({ segments, total, label }) {
  const R = 60, cx = 75, cy = 75
  const circ = 2 * Math.PI * R
  let offset = 0
  const nonZero = segments.filter(s => s.value > 0)
  const paths = nonZero.map((seg, i) => {
    const dash = (seg.value / total) * circ
    const el = (
      <circle
        key={i}
        cx={cx} cy={cy} r={R}
        fill="none"
        stroke={seg.color}
        strokeWidth="22"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    )
    offset += dash
    return el
  })

  return (
    <svg viewBox="0 0 150 150" className="db-donut-svg">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f1f5f9" strokeWidth="22" />
      {paths}
      <text x={cx} y={cy - 8} textAnchor="middle" className="db-donut-num">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="db-donut-lbl">{label}</text>
    </svg>
  )
}

// ─── Bar chart (pure SVG) ─────────────────────────────────────────────────────
function BarChart({ bars }) {
  if (!bars || bars.length === 0) return null
  const maxVal = Math.max(...bars.map(b => (b.present || 0) + (b.absent || 0) + (b.leave || 0)), 1)
  const roundedMax = Math.ceil(maxVal / 50) * 50 || 200
  const chartH = 180, chartW = 340, barW = 28, gap = 18
  const steps = [0, Math.round(roundedMax * 0.25), Math.round(roundedMax * 0.5), Math.round(roundedMax * 0.75), roundedMax]

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH + 40}`} className="db-bar-svg">
      {steps.map(v => {
        const y = chartH - (v / roundedMax) * chartH
        return (
          <g key={v}>
            <line x1="28" y1={y} x2={chartW} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x="24" y={y + 4} textAnchor="end" className="db-axis-lbl">{v}</text>
          </g>
        )
      })}

      {bars.map((bar, i) => {
        const x = 36 + i * (barW + gap)
        const pH = ((bar.present || 0) / roundedMax) * chartH
        const aH = ((bar.absent || 0) / roundedMax) * chartH
        const lH = ((bar.leave || 0) / roundedMax) * chartH
        return (
          <g key={i}>
            <rect x={x} y={chartH - pH - aH - lH} width={barW} height={lH || 0} fill="#f59e0b" />
            <rect x={x} y={chartH - pH - aH} width={barW} height={aH || 0} fill="#ef4444" />
            <rect x={x} y={chartH - pH} width={barW} height={pH || 0} fill="#22c55e" />
            <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" className="db-axis-lbl">{bar.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, subColor, bg, iconBg }) {
  return (
    <div className="db-stat-card" style={{ background: bg }}>
      <div className="db-stat-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="db-stat-body">
        <div className="db-stat-label">{label}</div>
        <div className="db-stat-value">
          {value}
          <span className="db-stat-arrow">→</span>
        </div>
        <div className="db-stat-sub" style={{ color: subColor || '#16a34a' }}>{sub}</div>
      </div>
    </div>
  )
}

const COURSE_COLORS = ['#6366f1', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#3b82f6', '#ec4899', '#10b981']

// ─── Dashboard ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(e => setError(e.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  // Derived values from a single API response
  const totalStudents  = data?.totalStudents  ?? 0
  const totalCourses   = data?.totalCourses   ?? 0
  const totalDivisions = data?.totalDivisions ?? 0
  const totalTeachers  = data?.totalTeachers  ?? 0
  const today          = data?.todayAttendance ?? {}
  const presentPct     = today.percentage ?? 0

  const weekBars = (data?.attendanceOverview ?? []).map(row => ({
    label:   shortDate(row.date),
    present: row.present  ?? 0,
    absent:  row.absent   ?? 0,
    leave:   row.leave    ?? 0,
  }))

  const courseWise = (data?.courseWiseStudents ?? []).map((c, i) => ({
    name:  c.course,
    count: c.students,
    color: COURSE_COLORS[i % COURSE_COLORS.length],
  }))

  const totalCourseStudents = courseWise.reduce((s, c) => s + c.count, 0)

  if (loading) {
    return (
      <div className="db-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div style={{ color: '#94a3b8', fontSize: '1rem' }}>Loading dashboard…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="db-page" style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        {error}
      </div>
    )
  }

  return (
    <div className="db-page">

      {/* ── Stat Cards ── */}
      <div className="db-stat-row">
        <StatCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M3 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="19" cy="7" r="3"/><path d="M23 20v-1.5a3 3 0 00-3-3"/></svg>}
          label="Total Students" value={totalStudents}
          sub="↑ Active students" subColor="#16a34a"
          bg="#f0fdf4" iconBg="rgba(34,197,94,0.15)"
        />
        <StatCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>}
          label="Total Courses" value={totalCourses}
          sub="+ Active courses" subColor="#2563eb"
          bg="#eff6ff" iconBg="rgba(37,99,235,0.12)"
        />
        <StatCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>}
          label="Total Divisions" value={totalDivisions}
          sub="+ Across all courses" subColor="#7c3aed"
          bg="#faf5ff" iconBg="rgba(124,58,237,0.12)"
        />
        <StatCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
          label="Total Teachers" value={totalTeachers}
          sub="+ Active teachers" subColor="#dc2626"
          bg="#fff1f2" iconBg="rgba(220,38,38,0.12)"
        />
        <StatCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round"/></svg>}
          label="Today's Attendance"
          value={`${today.present ?? 0}/${today.total ?? 0}`}
          sub={`↑ ${presentPct}% present`} subColor="#16a34a"
          bg="#fffbeb" iconBg="rgba(245,158,11,0.15)"
        />
      </div>

      {/* ── Charts ── */}
      <div className="db-charts-row">

        {/* Attendance Overview */}
        <div className="db-chart-card db-chart-bar">
          <div className="db-chart-header">
            <div className="db-chart-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-chart-icon">
                <rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="6" width="4" height="15" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>
              </svg>
              Attendance Overview
            </div>
            <div className="db-period-badge">This Week ▾</div>
          </div>

          {weekBars.length === 0
            ? <div className="db-chart-loading">No attendance data for this week.</div>
            : <BarChart bars={weekBars} />
          }

          <div className="db-bar-legend">
            <span><span className="db-legend-dot" style={{ background: '#22c55e' }} /> Present</span>
            <span><span className="db-legend-dot" style={{ background: '#ef4444' }} /> Absent</span>
            <span><span className="db-legend-dot" style={{ background: '#f59e0b' }} /> Leave</span>
          </div>
        </div>

        {/* Course Wise Students */}
        <div className="db-chart-card db-chart-donut">
          <div className="db-chart-header">
            <div className="db-chart-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-chart-icon">
                <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round"/>
              </svg>
              Course Wise Students
            </div>
            <span className="db-view-all">View All →</span>
          </div>

          {courseWise.length === 0
            ? <div className="db-chart-loading">No course data available.</div>
            : (
              <div className="db-donut-row">
                <DonutChart
                  segments={courseWise.map(c => ({ value: c.count, color: c.color }))}
                  total={totalCourseStudents}
                  label="Students"
                />
                <div className="db-donut-legend">
                  {courseWise.map((c, i) => (
                    <div key={i} className="db-donut-legend-row">
                      <span className="db-legend-circle" style={{ background: c.color }} />
                      <span className="db-donut-course-name">{c.name}</span>
                      <strong className="db-donut-count">{c.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
