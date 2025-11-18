import React from 'react'
import { isTruthy } from '@petspark/shared'

interface WelcomeScreenProps {
  onGetStarted: () => void
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const isValid = isTruthy(onGetStarted)
  
  return (
    <div>
      <h1>Welcome</h1>
      {isValid && <button onClick={() => void onGetStarted()}>Get Started</button>}
    </div>
  )
}