import React from 'react'
import { motion } from '@petspark/motion'

interface WelcomeScreenSimpleProps {
  onGetStarted: () => void
  onSignIn: () => void
}

export function WelcomeScreenSimple({ onGetStarted, onSignIn }: WelcomeScreenSimpleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1>Welcome to PetSpark</h1>
      <p>Connect with pet lovers around the world</p>
      
      <div>
        <button onClick={() => void onGetStarted()}>Get Started</button>
        <button onClick={() => void onSignIn()}>Sign In</button>
      </div>
    </motion.div>
  )
}