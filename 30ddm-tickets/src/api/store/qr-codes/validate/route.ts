import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { qrData } = req.body

  if (!qrData) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "QR code data is required"
    )
  }

  try {
    // Parse the QR code data
    let parsedData
    try {
      parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData
    } catch (parseError) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid QR code data format"
      )
    }

    const query = req.scope.resolve("query")

    // Validate the order and order item exists
    const { data: [order] } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "email",
        "created_at",
        "total",
        "currency_code",
        "items.*",
        "items.product.*",
        "items.variant.*",
        "customer.*",
        "billing_address.*",
      ],
      filters: {
        id: parsedData.orderId,
      },
    })

    if (!order) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Order not found or invalid"
      )
    }

    // Find the specific order item
    const orderItem = order.items?.find(item => item.id === parsedData.itemId)

    if (!orderItem) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Order item not found or invalid"
      )
    }

    // Verify the QR code data matches the database
    const isValid = 
      orderItem.id === parsedData.itemId &&
      order.id === parsedData.orderId &&
      orderItem.product?.id === parsedData.productId &&
      orderItem.quantity === parsedData.quantity

    if (!isValid) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "QR code data does not match order item information"
      )
    }

    res.json({
      valid: true,
      itemInfo: {
        itemId: orderItem.id,
        orderId: order.id,
        orderDisplayId: order.id,
        customerEmail: order.email,
        productTitle: orderItem.product?.title,
        variantTitle: orderItem.variant?.title,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unit_price,
        total: orderItem.total,
        orderDate: order.created_at,
      },
      scannedAt: new Date().toISOString(),
      message: "Order item is valid"
    })

  } catch (error) {
    if (error instanceof MedusaError) {
      throw error
    }
    
    console.error('Error validating QR code:', error)
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Failed to validate QR code"
    )
  }
}
