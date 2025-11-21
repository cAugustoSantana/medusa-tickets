import { SERVICE_FEE_PERCENTAGE } from "../../../config/service-fee"

// Utility functions extracted from hook logic for testing
export const calculateServiceFee = (ticketItems: any[]): number => {
  let totalServiceFee = 0
  for (const item of ticketItems) {
    const itemTotal = (item.unit_price || 0) * (item.quantity || 0)
    const serviceFeeForItem = Math.round(itemTotal * SERVICE_FEE_PERCENTAGE)
    totalServiceFee += serviceFeeForItem
  }
  return totalServiceFee
}

export const filterServiceFeeItems = (items: any[]) => {
  return items.filter((item: any) => item.metadata?.type !== "service_fee")
}

export const isServiceFeeItem = (item: any): boolean => {
  return item.metadata?.type === "service_fee"
}

describe("Service Fee Utility Functions", () => {
  const createMockTicketItem = (
    id: string,
    price: number,
    quantity: number = 1
  ) => ({
    id,
    unit_price: price,
    quantity,
    metadata: {},
    title: "Ticket",
  })

  const createMockServiceFeeItem = (id: string, amount: number) => ({
    id,
    unit_price: amount,
    quantity: 1,
    metadata: { type: "service_fee", fee_percentage: 10 },
    title: "Service Fee",
  })

  describe("calculateServiceFee", () => {
    it("should calculate service fee for single item", () => {
      const items = [createMockTicketItem("item_1", 100, 1)]
      const fee = calculateServiceFee(items)
      expect(fee).toBe(10)
    })

    it("should calculate service fee for multiple items", () => {
      const items = [
        createMockTicketItem("item_1", 100, 1),
        createMockTicketItem("item_2", 50, 1),
      ]
      const fee = calculateServiceFee(items)
      expect(fee).toBe(15) // 10% of $150
    })

    it("should calculate service fee with quantities", () => {
      const items = [createMockTicketItem("item_1", 100, 2)]
      const fee = calculateServiceFee(items)
      expect(fee).toBe(20) // 10% of $200
    })

    it("should handle zero prices", () => {
      const items = [createMockTicketItem("item_1", 0, 1)]
      const fee = calculateServiceFee(items)
      expect(fee).toBe(0)
    })

    it("should handle missing unit_price", () => {
      const items = [
        {
          id: "item_1",
          unit_price: undefined,
          quantity: 1,
          metadata: {},
        },
      ]
      const fee = calculateServiceFee(items)
      expect(fee).toBe(0)
    })

    it("should handle missing quantity", () => {
      const items = [
        {
          id: "item_1",
          unit_price: 100,
          quantity: undefined,
          metadata: {},
        },
      ]
      const fee = calculateServiceFee(items)
      expect(fee).toBe(0)
    })

    it("should round service fee correctly", () => {
      const items = [createMockTicketItem("item_1", 99, 1)]
      const fee = calculateServiceFee(items)
      expect(fee).toBe(10) // 9.9 rounded to 10
    })

    it("should handle decimal prices", () => {
      const items = [createMockTicketItem("item_1", 99.99, 1)]
      const fee = calculateServiceFee(items)
      expect(fee).toBe(10) // 9.999 rounded to 10
    })

    it("should handle very large numbers", () => {
      const items = [createMockTicketItem("item_1", 1000000, 1)]
      const fee = calculateServiceFee(items)
      expect(fee).toBe(100000)
    })
  })

  describe("filterServiceFeeItems", () => {
    it("should filter out service fee items", () => {
      const items = [
        createMockTicketItem("item_1", 100, 1),
        createMockServiceFeeItem("fee_1", 10),
      ]
      const filtered = filterServiceFeeItems(items)
      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe("item_1")
    })

    it("should keep all ticket items when no service fee exists", () => {
      const items = [
        createMockTicketItem("item_1", 100, 1),
        createMockTicketItem("item_2", 50, 1),
      ]
      const filtered = filterServiceFeeItems(items)
      expect(filtered.length).toBe(2)
    })

    it("should handle empty array", () => {
      const items: any[] = []
      const filtered = filterServiceFeeItems(items)
      expect(filtered.length).toBe(0)
    })

    it("should handle array with only service fee items", () => {
      const items = [createMockServiceFeeItem("fee_1", 10)]
      const filtered = filterServiceFeeItems(items)
      expect(filtered.length).toBe(0)
    })

    it("should handle items without metadata", () => {
      const items = [
        {
          id: "item_1",
          unit_price: 100,
          quantity: 1,
        },
      ]
      const filtered = filterServiceFeeItems(items)
      expect(filtered.length).toBe(1)
    })
  })

  describe("isServiceFeeItem", () => {
    it("should identify service fee items correctly", () => {
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      expect(isServiceFeeItem(serviceFeeItem)).toBe(true)
    })

    it("should return false for regular ticket items", () => {
      const ticketItem = createMockTicketItem("item_1", 100, 1)
      expect(isServiceFeeItem(ticketItem)).toBe(false)
    })

    it("should return false for items without metadata", () => {
      const item = {
        id: "item_1",
        unit_price: 100,
        quantity: 1,
      }
      expect(isServiceFeeItem(item)).toBe(false)
    })

    it("should return false for items with different metadata type", () => {
      const item = {
        id: "item_1",
        unit_price: 100,
        quantity: 1,
        metadata: { type: "discount" },
      }
      expect(isServiceFeeItem(item)).toBe(false)
    })

    it("should handle null metadata", () => {
      const item = {
        id: "item_1",
        unit_price: 100,
        quantity: 1,
        metadata: null,
      }
      expect(isServiceFeeItem(item)).toBe(false)
    })
  })
})

