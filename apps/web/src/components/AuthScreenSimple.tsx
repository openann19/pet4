import React, { useState } from 'react'
import { isTruthy } from '@petspark/shared'

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => void
  onSignUp: (email: string, password: string) => void
}

export function AuthScreen({ onSignIn, onSignUp }: AuthScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const isValid = isTruthy(email) && isTruthy(password)

  const handleSubmit = () => {
    if (!isValid) return
    
    if (isSignUp) {
      onSignUp(email, password)
    } else {
      onSignIn(email, password)
    }
  }

  return (
    <div>
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      <button 
        onClick={handleSubmit}
        disabled={!isValid}
      >
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </button>
      
      <button onClick={() => setIsSignUp(!isSignUp)}>
        Switch to {isSignUp ? 'Sign In' : 'Sign Up'}
      </button>
    </div>
  )
}