import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const query = req.scope.resolve("query")

  if (!id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Ticket ID is required")
  }

  // Set CORS headers for public access
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const { data: [ticketPurchase] } = await query.graph({
      entity: "ticket_purchase",
      fields: [
        "id",
        "seat_number",
        "row_number", 
        "show_date",
        "venue_row.*",
        "venue_row.venue.*",
        "ticket_product.*",
        "ticket_product.product.*",
        "order.*",
        "order.customer.*",
      ],
      filters: {
        id: id,
      },
    })

    if (!ticketPurchase) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Ticket not found")
    }

    // Return ticket information in a user-friendly format
    return res.json({
      valid: true,
      ticket: {
        id: ticketPurchase.id,
        seat: ticketPurchase.seat_number,
        row: ticketPurchase.venue_row?.row_number,
        rowType: ticketPurchase.venue_row?.row_type,
        showDate: ticketPurchase.show_date,
        venue: ticketPurchase.venue_row?.venue?.name,
        venueAddress: ticketPurchase.venue_row?.venue?.address,
        product: ticketPurchase.ticket_product?.product?.title,
        customer: {
          name: ticketPurchase.order?.customer?.first_name 
            ? `${ticketPurchase.order.customer.first_name} ${ticketPurchase.order.customer.last_name || ''}`.trim()
            : 'Guest',
          email: ticketPurchase.order?.customer?.email || ticketPurchase.order?.email
        },
        orderId: ticketPurchase.order?.id,
      },
      message: `Valid ticket for ${ticketPurchase.venue_row?.venue?.name} - Row ${ticketPurchase.venue_row?.row_number}, Seat ${ticketPurchase.seat_number}`,
      scannedAt: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof MedusaError) {
      throw error
    }
    
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Failed to validate ticket"
    )
  }
}
