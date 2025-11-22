import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { completeCartWithTicketsWorkflow } from "../../../../../workflows/complete-cart-with-tickets"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log('Starting complete-tickets workflow for cart:', req.params.id)
    
    const { result } = await completeCartWithTicketsWorkflow(req.scope).run({
      input: {
        cart_id: req.params.id,
      },
    })

    console.log('Complete-tickets workflow completed successfully:', result.order?.id)
    console.log('Order total:', result.order?.total)
    console.log('Order subtotal:', result.order?.subtotal)
    console.log('Order currency:', result.order?.currency_code)
    console.log('Order items:', result.order?.items?.map(item => item ? ({
      id: item.id,
      title: item.title,
      unit_price: item.unit_price,
      total: item.total,
      quantity: item.quantity
    }) : null))

    res.json({
      type: "order",
      order: result.order,
    })
  } catch (error) {
    console.error('Error in complete-tickets workflow:', error)
    res.status(500).json({
      message: error.message || "An unknown error occurred",
      error: error.toString()
    })
  }
}