import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVICE_FEE_CONFIG } from "../../../../../lib/config/service-fee"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id: cart_id } = req.params
    console.log('API Route - Request params:', req.params)
    console.log('API Route - Extracted cart_id:', cart_id)

    const query = req.scope.resolve("query")

    // Get cart data using query service
    const { data: [cart] } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "total",
        "subtotal",
        "currency_code",
        "items.*",
        "items.metadata"
      ],
      filters: {
        id: cart_id,
      },
    })

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      })
    }

    // Calculate service fee on subtotal (item_subtotal)
    const subtotal = cart.items.reduce((sum, item) => {
      if (!item) return sum
      // Skip service fee items to avoid double calculation
      if (item.metadata?.is_service_fee) {
        return sum
      }
      return sum + ((item.unit_price || 0) * (item.quantity || 0))
    }, 0)

    const serviceFeeAmount = Math.round(subtotal * SERVICE_FEE_CONFIG.PERCENTAGE)

    console.log('Service Fee API Debug:', {
      cart_id: cart_id,
      subtotal,
      serviceFeeAmount,
      percentage: SERVICE_FEE_CONFIG.PERCENTAGE,
      cart_items: cart.items?.length,
      cart_total: (cart as any).total
    })

    // Check if service fee already exists
    const existingServiceFee = cart.items.find(item =>
      item && item.metadata?.is_service_fee === true
    )

    if (existingServiceFee) {
      // Service fee already exists, just return the cart
      res.json({
        success: true,
        cart: cart,
        service_fee: serviceFeeAmount
      })
    } else {
      // For now, we'll just return the calculated service fee
      // The actual line item creation will be handled by the frontend
      // or we can implement this as a workflow step later
      res.json({
        success: true,
        cart: cart,
        service_fee: serviceFeeAmount,
        message: "Service fee calculated but not yet added as line item"
      })
    }
  } catch (error) {
    console.error('Error adding service fee:', error)
    res.status(500).json({
      message: error.message || "Failed to add service fee",
      error: error.toString()
    })
  }
}
