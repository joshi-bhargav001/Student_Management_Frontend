import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function EmailVerifiedPage() {
  const navigate = useNavigate()

  return (
    <div className="auth-shell">
      <div className="row justify-content-center">
        <div className="col-lg-5">
          <div className="card auth-card otp-card shadow-sm">
            <div className="card-body p-4 p-md-5 text-center">
              <div className="otp-icon otp-icon-success" aria-hidden="true">✓</div>
              <h1 className="otp-title">Email Verified Successfully</h1>
              <p className="otp-copy success-copy">Your account has been created.</p>
              <button
                type="button"
                className="btn btn-gradient success-button"
                onClick={() => navigate('/auth', { replace: true, state: { mode: 'signin' } })}
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
