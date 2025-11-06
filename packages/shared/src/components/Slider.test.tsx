import { render, screen } from "@testing-library/react"
import { Slider } from "./Slider"

describe("Slider", () => {
  it("renders with default props", () => {
    render(<Slider />)
    expect(screen.getByRole("slider")).toBeInTheDocument()
  })

  it("renders with custom min/max", () => {
    render(<Slider min={10} max={50} />)
    expect(screen.getByRole("slider")).toBeInTheDocument()
  })

  it("renders thumbs for array value", () => {
    render(<Slider value={[10, 20]} />)
    expect(screen.getAllByRole("slider-thumb").length).toBe(2)
  })
})
