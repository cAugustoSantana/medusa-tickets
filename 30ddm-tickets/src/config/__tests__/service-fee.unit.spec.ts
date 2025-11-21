import { SERVICE_FEE_PERCENTAGE } from "../service-fee"

describe("Service Fee Configuration", () => {
  describe("SERVICE_FEE_PERCENTAGE", () => {
    it("should export SERVICE_FEE_PERCENTAGE as 0.1 (10%)", () => {
      expect(SERVICE_FEE_PERCENTAGE).toBe(0.1)
    })

    it("should be a valid number between 0 and 1", () => {
      expect(typeof SERVICE_FEE_PERCENTAGE).toBe("number")
      expect(SERVICE_FEE_PERCENTAGE).toBeGreaterThan(0)
      expect(SERVICE_FEE_PERCENTAGE).toBeLessThanOrEqual(1)
    })

    it("should be usable in calculations", () => {
      const testPrice = 100
      const calculatedFee = testPrice * SERVICE_FEE_PERCENTAGE
      expect(calculatedFee).toBe(10)
    })
  })
})

