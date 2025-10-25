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

    // Fetch ticket purchases for this order
    const { data: ticketPurchases } = await query.graph({
      entity: "ticket_purchase",
      fields: [
        "id",
        "order_id",
        "seat_number",
        "show_date",
        "status",
        "ticket_product.*",
        "ticket_product.product.*",
        "ticket_product.venue.*",
        "venue_row.*",
      ],
      filters: {
        order_id: id,
      },
    })

    // Generate QR codes for each ticket purchase
    const qrCodes: Array<{
      itemId: string;
      qrCode: string;
      qrData: any;
      itemInfo: any;
    }> = []
    
    if (ticketPurchases && ticketPurchases.length > 0) {
      for (const purchase of ticketPurchases) {
        if (purchase?.id) {
          // Create QR code data for ticket purchase
          const qrData = {
            ticketId: purchase.id,
            orderId: order.id,
            seatNumber: purchase.seat_number,
            showDate: purchase.show_date,
            venue: purchase.ticket_product?.venue?.name,
            productTitle: purchase.ticket_product?.product?.title,
            rowType: purchase.venue_row?.row_type,
            validationUrl: `${process.env.STORE_URL || 'http://localhost:8000'}/tickets/validate/${purchase.id}`,
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
            itemId: purchase.id,
            qrCode: qrCodeDataURL,
            qrData: qrData,
            itemInfo: {
              productTitle: purchase.ticket_product?.product?.title,
              variantTitle: purchase.venue_row?.row_type === "general_access" ? "General Access" : (purchase.venue_row?.row_type || "General"),
              quantity: 1, // Each ticket purchase represents 1 ticket
              unitPrice: 0, // We don't have pricing info in ticket purchases
              total: 0, // We don't have pricing info in ticket purchases
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
