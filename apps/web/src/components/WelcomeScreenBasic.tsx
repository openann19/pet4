import React from 'react'

interface WelcomeScreenBasicProps {
  onGetStarted: () => void
  onSignIn: () => void
}

export function WelcomeScreenBasic({ onGetStarted, onSignIn }: WelcomeScreenBasicProps) {
  return (
    <div>
      <h1>Welcome to PetSpark</h1>
      <p>Connect with pet lovers around the world</p>
      
      <div>
        <button onClick={onGetStarted}>Get Started</button>
        <button onClick={onSignIn}>Sign In</button>
      </div>
    </div>
  )
}