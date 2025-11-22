import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { MedusaError } from "@medusajs/framework/utils"

completeCartWorkflow.hooks.validate(
  async ({ cart }, { container }) => {
    const query = container.resolve("query")

    const { data: items } = await query.graph({
      entity: "line_item",
      fields: ["id", "variant_id", "metadata", "quantity"],
      filters: {
        id: cart.items.map((item) => item.id).filter(Boolean) as string[],
      },
    })

    // Filter out service fee items from validation (they don't require shipping)
    const ticketItems = items.filter(
      (item: any) => item.metadata?.type !== "service_fee"
    )

    // Get the product variant to check if it's a ticket product variant
    const { data: productVariants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "product_id", "ticket_product_variant.purchases.*"],
      filters: {
        id: ticketItems.map((item) => item.variant_id).filter(Boolean) as string[],
      },
    })

    // Check for duplicate seats within the cart
    const seatDateCombinations = new Set<string>()
    
    for (const item of ticketItems) {
      const productVariant = productVariants.find(
        (variant) => variant.id === item.variant_id
      )

      // Check if this is a general access ticket
      const isGeneralAccess = item.metadata?.ticket_type === "general_access"
      
      // For seat-based tickets, quantity must be 1
      if (!isGeneralAccess && item.quantity !== 1) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA, 
          "You can only purchase one ticket for a seat."
        )
      }

      // Skip seat validation for general access tickets
      if (isGeneralAccess || !item.metadata?.seat_number) {
        continue
      }

      if (!item.metadata?.show_date) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA, 
          `Show date is required for seat ${item.metadata?.seat_number} in product ${productVariant?.product_id || 'unknown'}`
        )
      }

      // Create a unique key for seat and date combination
      const seatDateKey = `${item.metadata?.seat_number}-${item.metadata?.show_date}`
      
      // Check if this seat-date combination already exists in the cart
      if (seatDateCombinations.has(seatDateKey)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA, 
          `Duplicate seat ${item.metadata?.seat_number} found for show date ${item.metadata?.show_date} in cart`
        )
      }
      
      // Add to the set to track this combination
      seatDateCombinations.add(seatDateKey)

      // Check if seat has already been purchased
      if (!productVariant) continue
      
      const existingPurchase = productVariant.ticket_product_variant?.purchases.find(
        (purchase) => purchase?.seat_number === item.metadata?.seat_number 
          && purchase?.show_date === item.metadata?.show_date
      )

      if (existingPurchase) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA, 
          `Seat ${item.metadata?.seat_number} has already been purchased for show date ${item.metadata?.show_date}`
        )
      }
    }
  }
)