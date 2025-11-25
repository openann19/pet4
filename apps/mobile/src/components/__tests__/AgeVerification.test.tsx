// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { AgeVerification } from '../AgeVerification'

describe('AgeVerification (UI)', () => {
  const onVerified = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2025, 10, 16)))
    onVerified.mockReset()
  })

  it('accepts a valid DOB and calls onVerified(true)', async () => {
    const { findByText, getByPlaceholderText } = render(
      <AgeVerification requiredAge={13} onVerified={onVerified} />,
    )

    fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2012-11-16')
    fireEvent.press(await findByText(/Continue/i))

    expect(onVerified).toHaveBeenCalledWith(true)
  })

  it('rejects an underage DOB and does not call onVerified(true)', async () => {
    const { findByText, getByPlaceholderText } = render(
      <AgeVerification requiredAge={13} onVerified={onVerified} />,
    )

    fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2012-11-17')
    fireEvent.press(await findByText(/Continue/i))

    expect(onVerified).not.toHaveBeenCalledWith(true)
  })
})
