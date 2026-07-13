import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const initialForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  rememberMe: false
}

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, register, loading, authError, isAuthenticated } = useAuth()
  const [mode, setMode] = useState('signup')
  const [form, setForm] = useState(initialForm)
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  function validateSignup() {
    const errors = []
    if (!form.name.trim()) errors.push('Full name is required')
    if (!form.username.trim()) errors.push('Username is required')
    if (!form.email.trim()) errors.push('Email is required')
    if (!form.password) errors.push('Password is required')
    if (form.password !== form.confirmPassword) errors.push('Passwords do not match')
    if (form.password && form.password.length < 6) errors.push('Password should be at least 6 characters')
    return errors
  }

  function validateSignin() {
    const errors = []
    if (!form.username.trim()) errors.push('Username is required')
    if (!form.password) errors.push('Password is required')
    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setValidated(true)
    setFeedback({ type: '', message: '' })

    const errors = mode === 'signup' ? validateSignup() : validateSignin()
    if (errors.length) {
      setFeedback({ type: 'danger', message: errors[0] })
      return
    }

    try {
      if (mode === 'signup') {
        await register({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword
        })
        setFeedback({ type: 'success', message: 'Registration successful. Please sign in to continue.' })
        setForm({ ...initialForm, rememberMe: false })
        setMode('signin')
        setValidated(false)
      } else {
        await login({
          username: form.username,
          password: form.password
        })
        setFeedback({ type: 'success', message: 'Login successful. Redirecting to your dashboard...' })
      }
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message || 'Please try again.' })
    }
  }

  return (
    <div className="auth-shell">
      <div className="row g-4 justify-content-center">
        <div className="col-lg-5">
          <div className="card auth-card shadow-sm">
            <div className="card-body p-4 p-md-5">
              <div className="d-flex mb-4 auth-toggle">
                <button
                  type="button"
                  className={`btn flex-grow-1 ${mode === 'signup' ? 'btn-gradient' : 'btn-outline-primary'}`}
                  onClick={() => {
                    setMode('signup')
                    setForm(initialForm)
                    setFeedback({ type: '', message: '' })
                    setValidated(false)
                  }}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  className={`btn flex-grow-1 ${mode === 'signin' ? 'btn-gradient' : 'btn-outline-primary'}`}
                  onClick={() => {
                    setMode('signin')
                    setForm(initialForm)
                    setFeedback({ type: '', message: '' })
                    setValidated(false)
                  }}
                >
                  Sign In
                </button>
              </div>

              {(feedback.message || authError) && (
                <div className={`alert alert-${feedback.type || 'danger'} mb-4`} role="alert">
                  {feedback.message || authError}
                </div>
              )}

              <form className={`needs-validation ${validated ? 'was-validated' : ''}`} onSubmit={handleSubmit} noValidate autoComplete="off">
                {mode === 'signup' ? (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Full Name</label>
                      <input name="name" value={form.name} onChange={handleChange} className="form-control" required />
                      <div className="invalid-feedback">Please provide your full name.</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input name="username" value={form.username} onChange={handleChange} className="form-control" autoComplete="off" required />
                      <div className="invalid-feedback">Please provide a username.</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input type="email" name="email" value={form.email} onChange={handleChange} className="form-control" autoComplete="off" required />
                      <div className="invalid-feedback">Please provide a valid email.</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input type="password" name="password" value={form.password} onChange={handleChange} className="form-control" autoComplete="new-password" required />
                      <div className="invalid-feedback">Password is required.</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Confirm Password</label>
                      <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="form-control" autoComplete="new-password" required />
                      <div className="invalid-feedback">Please confirm your password.</div>
                    </div>

                    <button type="submit" className="btn btn-gradient w-100" disabled={loading}>
                      {loading ? (
                        <span className="d-flex align-items-center justify-content-center gap-2">
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Creating account...
                        </span>
                      ) : 'Register'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input name="username" value={form.username} onChange={handleChange} className="form-control" autoComplete="off" required />
                      <div className="invalid-feedback">Please provide your username.</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input type="password" name="password" value={form.password} onChange={handleChange} className="form-control" autoComplete="current-password" required />
                      <div className="invalid-feedback">Password is required.</div>
                    </div>

                    <div className="form-check mb-4">
                      <input className="form-check-input" type="checkbox" name="rememberMe" checked={form.rememberMe} onChange={handleChange} />
                      <label className="form-check-label">Remember me</label>
                    </div>

                    <button type="submit" className="btn btn-gradient w-100" disabled={loading}>
                      {loading ? (
                        <span className="d-flex align-items-center justify-content-center gap-2">
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Signing in...
                        </span>
                      ) : 'Login'}
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
