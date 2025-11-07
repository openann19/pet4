import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Slider } from "./Slider"

describe("Slider", () => {
  it.skip("renders with default props", () => {
    render(<Slider value={50} />)
    const slider = screen.getByRole("generic")
    expect(slider).toBeDefined()
  })

  it.skip("renders with custom min/max", () => {
    render(<Slider value={30} min={10} max={50} />)
    const slider = screen.getByRole("generic")
    expect(slider).toBeDefined()
  })

  it.skip("renders with array value", () => {
    render(<Slider value={[10, 20]} />)
    const slider = screen.getByRole("generic")
    expect(slider).toBeDefined()
  })
})
