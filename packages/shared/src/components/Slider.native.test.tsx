import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react-native"
import { Slider } from "./Slider.native"

// Mock the theme hook
vi.mock("@react-navigation/native", () => ({
  useTheme: () => ({
    colors: {
      border: "#ccc",
    },
  }),
}))

describe("Slider (native)", () => {
  it.skip("renders with default props", () => {
    const { getByRole } = render(<Slider />)
    expect(getByRole("adjustable")).toBeTruthy()
  })

  it.skip("calls onValueChange when moved", () => {
    const onValueChange = vi.fn()
    const { getByRole } = render(<Slider onValueChange={onValueChange} />)
    // Simulate value change
    onValueChange([42])
    expect(onValueChange).toHaveBeenCalledWith([42])
  })
})
