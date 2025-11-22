import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Slider } from './Slider'

describe('Slider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<Slider value={50} />)
      const slider = container.querySelector('.slider-container')
      expect(slider).toBeTruthy()
    })

    it('renders with custom value', () => {
      const { container } = render(<Slider value={75} min={0} max={100} />)
      const slider = container.querySelector('.slider-container')
      expect(slider).toBeTruthy()
    })

    it('renders with disabled state', () => {
      const { container } = render(<Slider value={50} disabled={true} />)
      const slider = container.querySelector('.slider-disabled')
      expect(slider).toBeTruthy()
      expect(slider?.getAttribute('aria-disabled')).toBe('true')
    })

    it('renders with range values', () => {
      const { container } = render(<Slider value={[25, 75]} />)
      const slider = container.querySelector('.slider-container')
      const thumbs = container.querySelectorAll('.slider-thumb')
      expect(slider).toBeTruthy()
      expect(thumbs).toHaveLength(2)
    })

    it('applies custom className', () => {
      const { container } = render(<Slider value={50} className="custom-class" />)
      const slider = container.querySelector('.slider-container')
      expect(slider?.className).toContain('custom-class')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes for single value', () => {
      render(<Slider value={50} min={0} max={100} aria-label="Volume" />)
      const slider = screen.getByRole('slider', { name: 'Volume' })
      expect(slider).toBeTruthy()
      expect(slider.getAttribute('aria-valuemin')).toBe('0')
      expect(slider.getAttribute('aria-valuemax')).toBe('100')
      expect(slider.getAttribute('aria-valuenow')).toBe('50')
    })

    it('has proper ARIA attributes for range values', () => {
      const { container } = render(<Slider value={[25, 75]} min={0} max={100} />)
      const thumbs = container.querySelectorAll('[role="slider"]')
      expect(thumbs).toHaveLength(2)
      expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('25')
      expect(thumbs[1]?.getAttribute('aria-valuenow')).toBe('75')
    })

    it('respects aria-labelledby', () => {
      render(
        <div>
          <span id="label">Volume Control</span>
          <Slider value={50} aria-labelledby="label" />
        </div>
      )
      const slider = screen.getByRole('slider')
      expect(slider.getAttribute('aria-labelledby')).toBe('label')
    })

    it('uses custom aria-valuetext when provided', () => {
      render(<Slider value={50} aria-valuetext="Medium" />)
      const slider = screen.getByRole('slider')
      expect(slider.getAttribute('aria-valuetext')).toBe('Medium')
    })

    it('generates aria-valuetext for range values', () => {
      const { container } = render(<Slider value={[25, 75]} />)
      const thumbs = container.querySelectorAll('[role="slider"]')
      expect(thumbs[0]?.getAttribute('aria-valuetext')).toBe('25')
      expect(thumbs[1]?.getAttribute('aria-valuetext')).toBe('75')
    })
  })

  describe('Value Updates', () => {
    it('calls onValueChange when value changes via mouse', async () => {
      const handleChange = vi.fn()
      const { container } = render(
        <Slider value={50} min={0} max={100} onValueChange={handleChange} />
      )

      const containerElement = container.querySelector('.slider-container') as HTMLElement
      const thumb = container.querySelector('.slider-thumb') as HTMLElement

      // Mock getBoundingClientRect for the container
      vi.spyOn(containerElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 24,
        right: 100,
        bottom: 24,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      } as DOMRect)

      fireEvent.mouseDown(thumb, { clientX: 80 })
      fireEvent.mouseMove(document, { clientX: 80 })
      fireEvent.mouseUp(document)

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalled()
      })
    })

    it('calls onValueChangeEnd when drag ends', async () => {
      const handleChangeEnd = vi.fn()
      const { container } = render(<Slider value={50} onValueChangeEnd={handleChangeEnd} />)

      const containerElement = container.querySelector('.slider-container') as HTMLElement
      const thumb = container.querySelector('.slider-thumb') as HTMLElement

      vi.spyOn(containerElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 24,
        right: 100,
        bottom: 24,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      } as DOMRect)

      fireEvent.mouseDown(thumb, { clientX: 50 })
      fireEvent.mouseMove(document, { clientX: 75 })
      fireEvent.mouseUp(document)

      await waitFor(() => {
        expect(handleChangeEnd).toHaveBeenCalled()
      })
    })

    it('updates range value when dragging min thumb', async () => {
      const handleChange = vi.fn()
      const { container } = render(<Slider value={[25, 75]} onValueChange={handleChange} />)

      const containerElement = container.querySelector('.slider-container') as HTMLElement
      const minThumb = container.querySelector('.slider-thumb-min') as HTMLElement

      vi.spyOn(containerElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 24,
        right: 100,
        bottom: 24,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      } as DOMRect)

      fireEvent.mouseDown(minThumb, { clientX: 25 })
      fireEvent.mouseMove(document, { clientX: 40 })
      fireEvent.mouseUp(document)

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalled()
      })
    })

    it('respects step parameter', () => {
      const handleChange = vi.fn()
      const { container } = render(
        <Slider value={50} min={0} max={100} step={10} onValueChange={handleChange} />
      )

      const containerElement = container.querySelector('.slider-container') as HTMLElement
      const track = container.querySelector('.slider-track') as HTMLElement

      vi.spyOn(containerElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 24,
        right: 100,
        bottom: 24,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      } as DOMRect)

      // Click at 37% which should round to 40 (nearest step of 10)
      fireEvent.click(track, { clientX: 37 })

      expect(handleChange).toHaveBeenCalled()
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1]
      const newValue = lastCall?.[0] as number
      expect(newValue).toBe(40)
      expect(newValue % 10).toBe(0)
    })

    it('clamps values to min and max', () => {
      const handleChange = vi.fn()
      const { container } = render(
        <Slider value={50} min={0} max={100} onValueChange={handleChange} />
      )

      const containerElement = container.querySelector('.slider-container') as HTMLElement
      const thumb = container.querySelector('.slider-thumb') as HTMLElement

      vi.spyOn(containerElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 24,
        right: 100,
        bottom: 24,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      } as DOMRect)

      fireEvent.mouseDown(thumb, { clientX: -100 })
      fireEvent.mouseMove(document, { clientX: -100 })

      expect(handleChange).toHaveBeenCalled()
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1]
      const newValue = lastCall?.[0] as number
      expect(newValue).toBeGreaterThanOrEqual(0)
      expect(newValue).toBeLessThanOrEqual(100)
    })
  })

  describe('Keyboard Navigation', () => {
    it('increases value on ArrowRight', () => {
      const handleChange = vi.fn()
      render(<Slider value={50} step={5} onValueChange={handleChange} />)

      const slider = screen.getByRole('slider')
      fireEvent.keyDown(slider, { key: 'ArrowRight' })

      expect(handleChange).toHaveBeenCalledWith(55)
    })

    it('decreases value on ArrowLeft', () => {
      const handleChange = vi.fn()
      render(<Slider value={50} step={5} onValueChange={handleChange} />)

      const slider = screen.getByRole('slider')
      fireEvent.keyDown(slider, { key: 'ArrowLeft' })

      expect(handleChange).toHaveBeenCalledWith(45)
    })

    it('sets to max on End key', () => {
      const handleChange = vi.fn()
      render(<Slider value={50} min={0} max={100} onValueChange={handleChange} />)

      const slider = screen.getByRole('slider')
      fireEvent.keyDown(slider, { key: 'End' })

      expect(handleChange).toHaveBeenCalledWith(100)
    })

    it('sets to min on Home key', () => {
      const handleChange = vi.fn()
      render(<Slider value={50} min={0} max={100} onValueChange={handleChange} />)

      const slider = screen.getByRole('slider')
      fireEvent.keyDown(slider, { key: 'Home' })

      expect(handleChange).toHaveBeenCalledWith(0)
    })
  })

  describe('Disabled State', () => {
    it('does not call onValueChange when disabled', () => {
      const handleChange = vi.fn()
      const { container } = render(
        <Slider value={50} disabled={true} onValueChange={handleChange} />
      )

      const thumb = container.querySelector('.slider-thumb') as HTMLElement
      fireEvent.mouseDown(thumb, { clientX: 100 })
      fireEvent.mouseMove(document, { clientX: 200 })

      expect(handleChange).not.toHaveBeenCalled()
    })

    it('does not respond to keyboard when disabled', () => {
      const handleChange = vi.fn()
      render(<Slider value={50} disabled={true} onValueChange={handleChange} />)

      const slider = screen.getByRole('slider')
      expect(slider.getAttribute('tabIndex')).toBe('-1')
    })

    it('has disabled cursor style when disabled', () => {
      const { container } = render(<Slider value={50} disabled={true} />)
      const slider = container.querySelector('.slider-container') as HTMLElement
      expect(slider.style.cursor).toBe('not-allowed')
    })
  })

  describe('Range Slider', () => {
    it('prevents min thumb from exceeding max thumb', () => {
      const handleChange = vi.fn()
      const { container } = render(<Slider value={[25, 75]} onValueChange={handleChange} />)

      const containerElement = container.querySelector('.slider-container') as HTMLElement
      const minThumb = container.querySelector('.slider-thumb-min') as HTMLElement

      vi.spyOn(containerElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 24,
        right: 100,
        bottom: 24,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      } as DOMRect)

      // Try to drag min thumb past max (90% of track)
      fireEvent.mouseDown(minThumb, { clientX: 25 })
      fireEvent.mouseMove(document, { clientX: 90 })

      expect(handleChange).toHaveBeenCalled()
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1]
      const newValues = lastCall?.[0] as number[]
      expect(newValues[0]).toBeLessThanOrEqual(newValues[1]!)
      expect(newValues[0]).toBe(newValues[1])
    })

    it('prevents max thumb from going below min thumb', () => {
      const handleChange = vi.fn()
      const { container } = render(<Slider value={[25, 75]} onValueChange={handleChange} />)

      const containerElement = container.querySelector('.slider-container') as HTMLElement
      const maxThumb = container.querySelector('.slider-thumb-max') as HTMLElement

      vi.spyOn(containerElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 24,
        right: 100,
        bottom: 24,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      } as DOMRect)

      // Try to drag max thumb below min (10% of track)
      fireEvent.mouseDown(maxThumb, { clientX: 75 })
      fireEvent.mouseMove(document, { clientX: 10 })

      expect(handleChange).toHaveBeenCalled()
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1]
      const newValues = lastCall?.[0] as number[]
      expect(newValues[1]).toBeGreaterThanOrEqual(newValues[0]!)
      expect(newValues[0]).toBe(newValues[1])
    })
  })
})
