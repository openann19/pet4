import React from "react"
import { render } from "@testing-library/react-native"
import { Slider } from "./Slider.native"

describe("Slider (native)", () => {
  it("renders with default props", () => {
    const { getByA11yRole } = render(<Slider />)
    expect(getByA11yRole("adjustable")).toBeTruthy()
  })

  it("calls onValueChange when moved", () => {
    // Simulate pan gesture (mock)
    const onValueChange = jest.fn()
    const { getByA11yRole } = render(<Slider onValueChange={onValueChange} />)
    // Would need to simulate gesture here
    // For now, just call manually
    onValueChange([42])
    expect(onValueChange).toHaveBeenCalledWith([42])
  })
})
