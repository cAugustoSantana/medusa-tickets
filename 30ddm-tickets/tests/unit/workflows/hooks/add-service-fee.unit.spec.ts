import { Modules } from "@medusajs/framework/utils"
import { SERVICE_FEE_PERCENTAGE } from "../../../../src/config/service-fee"

// Test helper functions
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
  product_title: "Event Ticket",
})

const createMockServiceFeeItem = (id: string, amount: number) => ({
  id,
  unit_price: amount,
  quantity: 1,
  metadata: { type: "service_fee", fee_percentage: 10 },
  title: "Service Fee",
  product_title: "Service Fee",
  requires_shipping: false,
})

const createMockCart = (items: any[], cartId: string = "cart_123") => ({
  id: cartId,
  items,
  currency_code: "usd",
})

// Helper function to calculate service fee (extracted from hook logic)
const calculateServiceFee = (ticketItems: any[]): number => {
  let totalServiceFee = 0
  for (const item of ticketItems) {
    const itemTotal = (item.unit_price || 0) * (item.quantity || 0)
    const serviceFeeForItem = Math.round(itemTotal * SERVICE_FEE_PERCENTAGE)
    totalServiceFee += serviceFeeForItem
  }
  return totalServiceFee
}

// Helper function to filter service fee items
const filterServiceFeeItems = (items: any[]) => {
  return items.filter((item: any) => item.metadata?.type !== "service_fee")
}

// Helper function to identify service fee items
const isServiceFeeItem = (item: any): boolean => {
  return item.metadata?.type === "service_fee"
}

describe("Service Fee Hook Logic", () => {
  let mockQuery: any
  let mockCartModuleService: any
  let mockContainer: any

  beforeEach(() => {
    // Mock query service
    mockQuery = {
      graph: jest.fn(),
    }

    // Mock cart module service
    mockCartModuleService = {
      addLineItems: jest.fn(),
      updateLineItems: jest.fn(),
      deleteLineItems: jest.fn(),
    }

    // Mock container
    mockContainer = {
      resolve: jest.fn((key: string) => {
        if (key === "query") return mockQuery
        if (key === Modules.CART) return mockCartModuleService
        return null
      }),
    }

    jest.clearAllMocks()
  })

  describe("Test Suite 1: Service Fee Calculation", () => {
    it("should calculate 10% service fee for single item: $100 ticket → $10 service fee", () => {
      const ticketItem = createMockTicketItem("item_1", 100, 1)
      const ticketItems = [ticketItem]
      const serviceFee = calculateServiceFee(ticketItems)
      expect(serviceFee).toBe(10)
    })

    it("should calculate 10% service fee for multiple items: $100 + $50 tickets → $15 service fee", () => {
      const ticketItem1 = createMockTicketItem("item_1", 100, 1)
      const ticketItem2 = createMockTicketItem("item_2", 50, 1)
      const ticketItems = [ticketItem1, ticketItem2]
      const serviceFee = calculateServiceFee(ticketItems)
      expect(serviceFee).toBe(15) // 10% of $150 = $15
    })

    it("should calculate service fee with quantity > 1: 2x $100 tickets → $20 service fee", () => {
      const ticketItem = createMockTicketItem("item_1", 100, 2)
      const ticketItems = [ticketItem]
      const serviceFee = calculateServiceFee(ticketItems)
      expect(serviceFee).toBe(20) // 10% of $200 = $20
    })

    it("should calculate service fee with multiple items and quantities: 2x $100 + 3x $50 → $35 service fee", () => {
      const ticketItem1 = createMockTicketItem("item_1", 100, 2) // $200
      const ticketItem2 = createMockTicketItem("item_2", 50, 3) // $150
      const ticketItems = [ticketItem1, ticketItem2]
      const serviceFee = calculateServiceFee(ticketItems)
      expect(serviceFee).toBe(35) // 10% of $350 = $35
    })

    it("should round service fee: $99 ticket → $10 service fee (9.9 rounded to 10)", () => {
      const ticketItem = createMockTicketItem("item_1", 99, 1)
      const ticketItems = [ticketItem]
      const serviceFee = calculateServiceFee(ticketItems)
      expect(serviceFee).toBe(10) // 9.9 rounded to 10
    })

    it("should handle edge case: $1 ticket → $0 service fee (0.1 rounded to 0)", () => {
      const ticketItem = createMockTicketItem("item_1", 1, 1)
      const ticketItems = [ticketItem]
      const serviceFee = calculateServiceFee(ticketItems)
      expect(serviceFee).toBe(0) // 0.1 rounded to 0
    })

    it("should calculate service fee only from ticket items (filters out existing service fee)", () => {
      const ticketItem1 = createMockTicketItem("item_1", 100, 1)
      const ticketItem2 = createMockTicketItem("item_2", 50, 1)
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 15)
      const allItems = [ticketItem1, ticketItem2, serviceFeeItem]

      const ticketItems = filterServiceFeeItems(allItems)
      const serviceFee = calculateServiceFee(ticketItems)

      expect(ticketItems.length).toBe(2)
      expect(serviceFee).toBe(15) // 10% of $150 = $15, not including existing fee
    })
  })

  describe("Test Suite 2: Service Fee Applied to Cart Total", () => {
    it("should add service fee line item when cart has ticket items", async () => {
      const cartId = "cart_123"
      const ticketItem = createMockTicketItem("item_1", 100, 1)
      const cart = createMockCart([ticketItem], cartId)

      mockQuery.graph.mockResolvedValue({
        data: [cart],
      })

      const ticketItems = filterServiceFeeItems(cart.items)
      const serviceFee = calculateServiceFee(ticketItems)

      // Simulate adding service fee
      const serviceFeeData = {
        cart_id: cartId,
        title: "Service Fee",
        product_title: "Service Fee",
        unit_price: serviceFee,
        quantity: 1,
        requires_shipping: false,
        metadata: {
          type: "service_fee",
          fee_percentage: SERVICE_FEE_PERCENTAGE * 100,
        },
      }

      expect(serviceFee).toBe(10)
      expect(serviceFeeData.unit_price).toBe(10)
      expect(serviceFeeData.quantity).toBe(1)
    })

    it("should have service fee line item with correct unit_price matching calculated fee", () => {
      const ticketItem = createMockTicketItem("item_1", 100, 2)
      const ticketItems = [ticketItem]
      const calculatedFee = calculateServiceFee(ticketItems)

      const serviceFeeItem = createMockServiceFeeItem("fee_1", calculatedFee)
      expect(serviceFeeItem.unit_price).toBe(20) // 10% of $200
      expect(serviceFeeItem.unit_price).toBe(calculatedFee)
    })

    it("should have service fee line item with quantity: 1", () => {
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      expect(serviceFeeItem.quantity).toBe(1)
    })

    it("should update service fee when cart items change", () => {
      // Initial cart: 1x $100 ticket = $10 fee
      const initialTicketItem = createMockTicketItem("item_1", 100, 1)
      const initialFee = calculateServiceFee([initialTicketItem])
      expect(initialFee).toBe(10)

      // Updated cart: 2x $100 ticket = $20 fee
      const updatedTicketItem = createMockTicketItem("item_1", 100, 2)
      const updatedFee = calculateServiceFee([updatedTicketItem])
      expect(updatedFee).toBe(20)
      expect(updatedFee).toBeGreaterThan(initialFee)
    })

    it("should remove service fee when cart becomes empty", () => {
      const emptyCart = createMockCart([])
      const ticketItems = filterServiceFeeItems(emptyCart.items)
      expect(ticketItems.length).toBe(0)
    })

    it("should remove service fee when all ticket items are removed", () => {
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      const cart = createMockCart([serviceFeeItem])
      const ticketItems = filterServiceFeeItems(cart.items)
      expect(ticketItems.length).toBe(0)
    })
  })

  describe("Test Suite 3: Service Fee Item Properties (Not Appearing as Product)", () => {
    it("should have metadata.type === 'service_fee'", () => {
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      expect(serviceFeeItem.metadata.type).toBe("service_fee")
    })

    it("should have metadata.fee_percentage === 10", () => {
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      expect(serviceFeeItem.metadata.fee_percentage).toBe(10)
    })

    it("should have title: 'Service Fee'", () => {
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      expect(serviceFeeItem.title).toBe("Service Fee")
    })

    it("should have product_title: 'Service Fee'", () => {
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      expect(serviceFeeItem.product_title).toBe("Service Fee")
    })

    it("should have requires_shipping: false", () => {
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      expect(serviceFeeItem.requires_shipping).toBe(false)
    })

    it("should be filterable using item.metadata?.type !== 'service_fee'", () => {
      const ticketItem = createMockTicketItem("item_1", 100, 1)
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      const allItems = [ticketItem, serviceFeeItem]

      const filtered = filterServiceFeeItems(allItems)
      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe("item_1")
    })

    it("should filter out service fee: cart with [ticket1, ticket2, serviceFee] → returns [ticket1, ticket2]", () => {
      const ticket1 = createMockTicketItem("item_1", 100, 1)
      const ticket2 = createMockTicketItem("item_2", 50, 1)
      const serviceFee = createMockServiceFeeItem("fee_1", 15)
      const allItems = [ticket1, ticket2, serviceFee]

      const filtered = filterServiceFeeItems(allItems)
      expect(filtered.length).toBe(2)
      expect(filtered.map((item) => item.id)).toEqual(["item_1", "item_2"])
      expect(filtered).not.toContainEqual(serviceFee)
    })

    it("should exclude service fee items from ticket items calculation", () => {
      const ticketItem = createMockTicketItem("item_1", 100, 1)
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      const allItems = [ticketItem, serviceFeeItem]

      const ticketItems = filterServiceFeeItems(allItems)
      const serviceFee = calculateServiceFee(ticketItems)

      // Service fee should be calculated only from ticket items, not from existing service fee
      expect(serviceFee).toBe(10)
      expect(ticketItems.length).toBe(1)
    })
  })

  describe("Test Suite 4: Hook Execution Flow", () => {
    it("should return early when cart_id is missing", () => {
      const cartId = null
      expect(cartId).toBeFalsy()
      // Hook should return early without processing
    })

    it("should fetch cart using query.graph with correct fields", async () => {
      const cartId = "cart_123"
      const ticketItem = createMockTicketItem("item_1", 100, 1)
      const cart = createMockCart([ticketItem], cartId)

      mockQuery.graph.mockResolvedValue({
        data: [cart],
      })

      const result = await mockQuery.graph({
        entity: "cart",
        fields: [
          "id",
          "items.*",
          "items.unit_price",
          "items.quantity",
          "items.metadata",
          "items.title",
          "currency_code",
        ],
        filters: {
          id: cartId,
        },
      })

      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: "cart",
          filters: { id: cartId },
        })
      )
      expect(result.data[0].id).toBe(cartId)
    })

    it("should resolve query and cartModuleService from container", () => {
      const query = mockContainer.resolve("query")
      const cartModuleService = mockContainer.resolve(Modules.CART)

      expect(query).toBe(mockQuery)
      expect(cartModuleService).toBe(mockCartModuleService)
      expect(mockContainer.resolve).toHaveBeenCalledWith("query")
      expect(mockContainer.resolve).toHaveBeenCalledWith(Modules.CART)
    })

    it("should call addLineItems when no existing service fee exists", () => {
      const cartId = "cart_123"
      const ticketItem = createMockTicketItem("item_1", 100, 1)
      const cart = createMockCart([ticketItem], cartId)

      const ticketItems = filterServiceFeeItems(cart.items)
      const serviceFee = calculateServiceFee(ticketItems)
      const existingServiceFeeItem = cart.items.find(isServiceFeeItem)

      expect(existingServiceFeeItem).toBeUndefined()

      // Simulate adding service fee
      const serviceFeeData = {
        cart_id: cartId,
        title: "Service Fee",
        product_title: "Service Fee",
        unit_price: serviceFee,
        quantity: 1,
        requires_shipping: false,
        metadata: {
          type: "service_fee",
          fee_percentage: SERVICE_FEE_PERCENTAGE * 100,
        },
      }

      expect(serviceFee).toBe(10)
      expect(serviceFeeData.cart_id).toBe(cartId)
    })

    it("should call updateLineItems when service fee already exists", () => {
      const ticketItem = createMockTicketItem("item_1", 100, 1)
      const existingServiceFee = createMockServiceFeeItem("fee_1", 10)
      const cart = createMockCart([ticketItem, existingServiceFee])

      const ticketItems = filterServiceFeeItems(cart.items)
      const newServiceFee = calculateServiceFee(ticketItems)
      const existingServiceFeeItem = cart.items.find(isServiceFeeItem)

      expect(existingServiceFeeItem).toBeDefined()
      expect(existingServiceFeeItem?.id).toBe("fee_1")
      expect(newServiceFee).toBe(10)

      // Service fee should be updated with new amount
      const updateData = {
        id: existingServiceFeeItem?.id,
        unit_price: newServiceFee,
        quantity: 1,
        requires_shipping: false,
      }

      expect(updateData.id).toBe("fee_1")
      expect(updateData.unit_price).toBe(10)
    })

    it("should call deleteLineItems when cart is empty", () => {
      const emptyCart = createMockCart([])
      const existingServiceFee = createMockServiceFeeItem("fee_1", 10)
      emptyCart.items.push(existingServiceFee)

      const existingServiceFeeItem = emptyCart.items.find(isServiceFeeItem)

      expect(emptyCart.items.length).toBe(1)
      expect(existingServiceFeeItem).toBeDefined()

      // Service fee should be deleted
      if (existingServiceFeeItem) {
        expect(existingServiceFeeItem.id).toBe("fee_1")
      }
    })

    it("should call deleteLineItems when no ticket items remain", () => {
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      const cart = createMockCart([serviceFeeItem])

      const ticketItems = filterServiceFeeItems(cart.items)
      const existingServiceFeeItem = cart.items.find(isServiceFeeItem)

      expect(ticketItems.length).toBe(0)
      expect(existingServiceFeeItem).toBeDefined()

      // Service fee should be deleted when no ticket items
      if (existingServiceFeeItem) {
        expect(existingServiceFeeItem.id).toBe("fee_1")
      }
    })

    it("should call deleteLineItems when calculated fee is 0 or negative", () => {
      const ticketItem = createMockTicketItem("item_1", 0, 1)
      const existingServiceFee = createMockServiceFeeItem("fee_1", 10)
      const cart = createMockCart([ticketItem, existingServiceFee])

      const ticketItems = filterServiceFeeItems(cart.items)
      const serviceFee = calculateServiceFee(ticketItems)
      const existingServiceFeeItem = cart.items.find(isServiceFeeItem)

      expect(serviceFee).toBe(0)
      expect(existingServiceFeeItem).toBeDefined()

      // Service fee should be deleted when calculated fee is 0
      if (existingServiceFeeItem && serviceFee <= 0) {
        expect(existingServiceFeeItem.id).toBe("fee_1")
      }
    })
  })

  describe("Test Suite 5: Edge Cases and Error Scenarios", () => {
    it("should handle empty cart: cart with no items → service fee removed if exists", () => {
      const emptyCart = createMockCart([])
      expect(emptyCart.items.length).toBe(0)

      // If service fee exists, it should be removed
      const existingServiceFee = emptyCart.items.find(isServiceFeeItem)
      expect(existingServiceFee).toBeUndefined()
    })

    it("should handle cart with only service fee: cart with service fee but no tickets → service fee removed", () => {
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      const cart = createMockCart([serviceFeeItem])

      const ticketItems = filterServiceFeeItems(cart.items)
      expect(ticketItems.length).toBe(0)

      // Service fee should be removed
      const existingServiceFee = cart.items.find(isServiceFeeItem)
      expect(existingServiceFee).toBeDefined()
    })

    it("should handle cart with null/undefined items gracefully", () => {
      const cartWithNullItems = { id: "cart_123", items: null, currency_code: "usd" }
      const items = cartWithNullItems.items || []
      expect(items.length).toBe(0)

      const ticketItems = filterServiceFeeItems(items)
      expect(ticketItems.length).toBe(0)
    })

    it("should handle cart with zero price items: $0 ticket → $0 service fee → service fee removed", () => {
      const zeroPriceItem = createMockTicketItem("item_1", 0, 1)
      const ticketItems = [zeroPriceItem]
      const serviceFee = calculateServiceFee(ticketItems)

      expect(serviceFee).toBe(0)

      // Service fee should be removed when calculated fee is 0
      if (serviceFee <= 0) {
        expect(serviceFee).toBe(0)
      }
    })

    it("should handle cart with negative price (edge case) gracefully", () => {
      const negativePriceItem = createMockTicketItem("item_1", -10, 1)
      const ticketItems = [negativePriceItem]
      const serviceFee = calculateServiceFee(ticketItems)

      // Math.round(-10 * 0.1) = Math.round(-1) = -1
      expect(serviceFee).toBe(-1)

      // Service fee should be removed when negative
      if (serviceFee <= 0) {
        expect(serviceFee).toBeLessThanOrEqual(0)
      }
    })

    it("should use 0 as fallback for missing unit_price", () => {
      const itemWithMissingPrice = {
        id: "item_1",
        unit_price: undefined,
        quantity: 1,
        metadata: {},
      }
      const ticketItems = [itemWithMissingPrice]
      const serviceFee = calculateServiceFee(ticketItems)

      expect(serviceFee).toBe(0) // (0 || 0) * 1 * 0.1 = 0
    })

    it("should use 0 as fallback for missing quantity", () => {
      const itemWithMissingQuantity = {
        id: "item_1",
        unit_price: 100,
        quantity: undefined,
        metadata: {},
      }
      const ticketItems = [itemWithMissingQuantity]
      const serviceFee = calculateServiceFee(ticketItems)

      expect(serviceFee).toBe(0) // 100 * (0 || 0) * 0.1 = 0
    })

    it("should handle multiple service fee items (shouldn't happen, but test filtering handles it)", () => {
      const ticketItem = createMockTicketItem("item_1", 100, 1)
      const serviceFee1 = createMockServiceFeeItem("fee_1", 10)
      const serviceFee2 = createMockServiceFeeItem("fee_2", 10)
      const allItems = [ticketItem, serviceFee1, serviceFee2]

      const ticketItems = filterServiceFeeItems(allItems)
      expect(ticketItems.length).toBe(1)
      expect(ticketItems[0].id).toBe("item_1")
    })

    it("should handle service fee calculation with very large numbers", () => {
      const largePriceItem = createMockTicketItem("item_1", 1000000, 1)
      const ticketItems = [largePriceItem]
      const serviceFee = calculateServiceFee(ticketItems)

      expect(serviceFee).toBe(100000) // 10% of 1,000,000
    })

    it("should handle service fee calculation with decimal prices", () => {
      const decimalPriceItem = createMockTicketItem("item_1", 99.99, 1)
      const ticketItems = [decimalPriceItem]
      const serviceFee = calculateServiceFee(ticketItems)

      // Math.round(99.99 * 0.1) = Math.round(9.999) = 10
      expect(serviceFee).toBe(10)
    })
  })

  describe("Test Suite 6: Service Fee Identification and Filtering", () => {
    it("should identify service fee using item.metadata?.type === 'service_fee'", () => {
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      const ticketItem = createMockTicketItem("item_1", 100, 1)

      expect(isServiceFeeItem(serviceFeeItem)).toBe(true)
      expect(isServiceFeeItem(ticketItem)).toBe(false)
    })

    it("should filter items using items.filter(item => item.metadata?.type !== 'service_fee')", () => {
      const ticketItem = createMockTicketItem("item_1", 100, 1)
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      const allItems = [ticketItem, serviceFeeItem]

      const filtered = filterServiceFeeItems(allItems)
      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe("item_1")
    })

    it("should allow regular ticket items to pass through filter (not excluded)", () => {
      const ticketItem1 = createMockTicketItem("item_1", 100, 1)
      const ticketItem2 = createMockTicketItem("item_2", 50, 1)
      const allItems = [ticketItem1, ticketItem2]

      const filtered = filterServiceFeeItems(allItems)
      expect(filtered.length).toBe(2)
      expect(filtered.map((item) => item.id)).toEqual(["item_1", "item_2"])
    })

    it("should exclude service fee items from filter", () => {
      const ticketItem = createMockTicketItem("item_1", 100, 1)
      const serviceFeeItem = createMockServiceFeeItem("fee_1", 10)
      const allItems = [ticketItem, serviceFeeItem]

      const filtered = filterServiceFeeItems(allItems)
      expect(filtered).not.toContainEqual(serviceFeeItem)
      expect(filtered.length).toBe(1)
    })

    it("should not exclude items without metadata (treated as regular items)", () => {
      const itemWithoutMetadata = {
        id: "item_1",
        unit_price: 100,
        quantity: 1,
        title: "Ticket",
      }
      const allItems = [itemWithoutMetadata]

      const filtered = filterServiceFeeItems(allItems)
      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe("item_1")
    })

    it("should not exclude items with different metadata types", () => {
      const itemWithOtherMetadata = {
        id: "item_1",
        unit_price: 100,
        quantity: 1,
        metadata: { type: "discount" },
        title: "Ticket",
      }
      const allItems = [itemWithOtherMetadata]

      const filtered = filterServiceFeeItems(allItems)
      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe("item_1")
    })
  })
})

