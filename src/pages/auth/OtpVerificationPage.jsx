import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { registerUser, verifyOtp, sendOtp } from '../../api/auth'

const OTP_LENGTH = 6
const OTP_EXPIRY_SECONDS = 300
const OTP_STORAGE_KEY = 'pendingOtpSignup'

function getStoredSignup() {
  if (typeof window === 'undefined') return null
  const stored = window.sessionStorage.getItem(OTP_STORAGE_KEY)

  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function OtpVerificationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const signupData = useMemo(() => location.state?.signupData || getStoredSignup(), [location.state?.signupData])
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const inputRefs = useRef([])

  useEffect(() => {
    if (!signupData?.email) {
      navigate('/auth', { replace: true })
    }
  }, [navigate, signupData])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  function handleChange(index, value) {
    if (!/^\d?$/.test(value)) return

    const nextOtp = [...otp]
    nextOtp[index] = value
    setOtp(nextOtp)

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(event) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)

    if (!pasted) return

    const nextOtp = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((digit, index) => {
      nextOtp[index] = digit
    })
    setOtp(nextOtp)

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  async function handleVerify(event) {
    event.preventDefault()
    const enteredOtp = otp.join('')

    if (enteredOtp.length !== OTP_LENGTH) {
      setFeedback({ type: 'danger', message: 'Please enter the 6-digit OTP.' })
      return
    }

    setSubmitting(true)
    setFeedback({ type: '', message: '' })

    try {
      await verifyOtp({
        email: signupData.email,
        otp: enteredOtp
      })
      await registerUser({
        name: signupData.name,
        username: signupData.username,
        email: signupData.email,
        password: signupData.password,
        confirmPassword: signupData.confirmPassword
      })
      window.sessionStorage.removeItem(OTP_STORAGE_KEY)
      navigate('/auth/verified', { replace: true })
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message || 'OTP verification failed.' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (!signupData) return

    setResending(true)
    setFeedback({ type: '', message: '' })

    try {
      await sendOtp(signupData)
      setSecondsLeft(OTP_EXPIRY_SECONDS)
      setOtp(Array(OTP_LENGTH).fill(''))
      setFeedback({ type: 'success', message: 'A new OTP has been sent to your email.' })
      inputRefs.current[0]?.focus()
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message || 'Unable to resend OTP.' })
    } finally {
      setResending(false)
    }
  }

  if (!signupData?.email) return null

  return (
    <div className="auth-shell">
      <div className="row justify-content-center">
        <div className="col-lg-6 col-xl-5">
          <div className="card auth-card otp-card shadow-sm">
            <div className="card-body p-4 p-md-5 text-center">
              <div className="otp-icon" aria-hidden="true">✉</div>
              <h1 className="otp-title">Verify Your Email</h1>
              <p className="otp-copy">We&apos;ve sent a 6-digit OTP to</p>
              <p className="otp-email">{signupData.email}</p>

              {(feedback.message) && (
                <div className={`alert alert-${feedback.type || 'danger'} mt-4 mb-4`} role="alert">
                  {feedback.message}
                </div>
              )}

              <form onSubmit={handleVerify}>
                <label className="otp-label">Enter OTP</label>
                <div className="otp-input-group" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="otp-input"
                      value={digit}
                      onChange={(event) => handleChange(index, event.target.value)}
                      onKeyDown={(event) => handleKeyDown(index, event)}
                      aria-label={`OTP digit ${index + 1}`}
                    />
                  ))}
                </div>

                <p className="otp-timer">OTP expires in {formatTime(secondsLeft)}</p>

                <button type="submit" className="btn btn-gradient w-100 otp-submit" disabled={submitting}>
                  {submitting ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>

              <p className="otp-resend-copy">Didn&apos;t receive the code?</p>
              <button type="button" className="btn btn-link otp-resend" onClick={handleResend} disabled={resending}>
                {resending ? 'Resending...' : 'Resend OTP'}
              </button>

              <Link to="/auth" className="otp-back">
                ← Back to Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
