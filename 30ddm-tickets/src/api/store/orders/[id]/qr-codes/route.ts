import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import QRCode from "qrcode"
import { MedusaError } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const query = req.scope.resolve("query")

  try {
    // Fetch order details
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
        "shipping_address.*",
      ],
      filters: {
        id: id,
      },
    })

    if (!order) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
    }

    // Generate QR codes for each order item
    const qrCodes: Array<{
      itemId: string;
      qrCode: string;
      qrData: any;
      itemInfo: any;
    }> = []
    
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item?.id) {
          // Create QR code data for order item
          const qrData = {
            orderId: order.id,
            itemId: item.id,
            productId: item.product?.id,
            productTitle: item.product?.title,
            variantTitle: item.variant?.title,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            total: item.total,
            customerEmail: order.email,
            orderDate: order.created_at,
          }

          // Generate QR code as data URL (base64)
          const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })

          qrCodes.push({
            itemId: item.id,
            qrCode: qrCodeDataURL,
            qrData: qrData,
            itemInfo: {
              productTitle: item.product?.title,
              variantTitle: item.variant?.title,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              total: item.total,
            }
          })
        }
      }
    }

    res.json({
      orderId: order.id,
      orderDisplayId: order.id, // Using order.id since display_id might not exist
      customerEmail: order.email,
      qrCodes: qrCodes,
      totalItems: qrCodes.length
    })

  } catch (error) {
    console.error('Error generating QR codes for order:', id, error)
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Failed to generate QR codes"
    )
  }
}
