import { refreshCartItemsWorkflow } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { SERVICE_FEE_PERCENTAGE } from "../../config/service-fee"

refreshCartItemsWorkflow.hooks.beforeRefreshingPaymentCollection(
  async ({ input }, { container }) => {
    const query = container.resolve("query")
    const cartModuleService = container.resolve(Modules.CART)

    const cartId = input.cart_id
    if (!cartId) {
      return
    }

    console.log('[Service Fee Hook] Running for cart:', cartId)

    // Fetch the cart with all line items to calculate service fee
    const { data: carts } = await query.graph({
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

    const currentCart = carts[0]
    if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
      // If cart is empty, remove service fee if it exists
      const existingServiceFeeItem = currentCart?.items?.find(
        (item: any) => item.metadata?.type === "service_fee"
      )
      if (existingServiceFeeItem) {
        await cartModuleService.deleteLineItems([existingServiceFeeItem.id])
      }
      return
    }

    // Filter out service fee items and calculate total service fee
    const ticketItems = currentCart.items.filter(
      (item: any) => item.metadata?.type !== "service_fee"
    )

    if (ticketItems.length === 0) {
      // No ticket items, remove service fee if it exists
      const existingServiceFeeItem = currentCart.items.find(
        (item: any) => item.metadata?.type === "service_fee"
      )
      if (existingServiceFeeItem) {
        await cartModuleService.deleteLineItems([existingServiceFeeItem.id])
      }
      return
    }

    // Calculate total service fee (10% of all ticket items)
    let totalServiceFee = 0
    for (const item of ticketItems) {
      if (!item) continue
      const itemTotal = (item.unit_price || 0) * (item.quantity || 0)
      const serviceFeeForItem = Math.round(itemTotal * SERVICE_FEE_PERCENTAGE)
      totalServiceFee += serviceFeeForItem
    }

    console.log('[Service Fee Hook] Calculated service fee:', totalServiceFee, 'for', ticketItems.length, 'ticket items')

    // Find existing service fee line item
    const existingServiceFeeItem = currentCart.items.find(
      (item: any) => item.metadata?.type === "service_fee"
    )

    if (totalServiceFee <= 0) {
      // If calculated fee is 0 or negative, remove service fee if it exists
      if (existingServiceFeeItem) {
        console.log('[Service Fee Hook] Removing service fee (calculated fee is 0)')
        await cartModuleService.deleteLineItems([existingServiceFeeItem.id])
      }
      return
    }

    if (existingServiceFeeItem) {
      // Update existing service fee line item
      console.log('[Service Fee Hook] Updating existing service fee:', existingServiceFeeItem.id, 'to', totalServiceFee)
      await cartModuleService.updateLineItems([
        {
          id: existingServiceFeeItem.id,
          unit_price: totalServiceFee,
          quantity: 1,
          requires_shipping: false, // Ensure service fee doesn't require shipping
        },
      ])
    } else {
      // Add new service fee line item
      console.log('[Service Fee Hook] Adding new service fee:', totalServiceFee)
      await cartModuleService.addLineItems([
        {
          cart_id: cartId,
          title: "Service Fee",
          product_title: "Service Fee",
          unit_price: totalServiceFee,
          quantity: 1,
          requires_shipping: false, // Service fee doesn't require shipping
          metadata: {
            type: "service_fee",
            fee_percentage: SERVICE_FEE_PERCENTAGE * 100,
          },
        },
      ])
    }
    console.log('[Service Fee Hook] Completed for cart:', cartId)
  }
)

