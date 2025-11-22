import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TICKET_BOOKING_MODULE } from "../../../../../modules/ticket-booking"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    console.log("Fetching stats for show ID:", id)
    
    const ticketBookingModuleService = req.scope.resolve(TICKET_BOOKING_MODULE)
    const query = req.scope.resolve("query")

    // Get ticket product details
    const ticketProduct = await ticketBookingModuleService.retrieveTicketProduct(id, {
      relations: [
        "venue",
      ],
    })

    console.log("Ticket product found:", ticketProduct?.id)

    if (!ticketProduct) {
      return res.status(404).json({ message: "Show not found" })
    }

    // Get the actual product details separately
    console.log("Fetching product details for product_id:", ticketProduct.product_id)
    const product = await query.graph({
      entity: "product",
      fields: ["id", "title", "description"],
      filters: {
        id: ticketProduct.product_id,
      },
    })

    console.log("Product found:", product?.data?.[0]?.title || "Not found")

    // Get all ticket purchases for this show
    console.log("Fetching ticket purchases...")
    const { data: ticketPurchases } = await query.graph({
      entity: "ticket_purchase",
      fields: [
        "id",
        "order_id",
        "seat_number",
        "show_date",
        "status",
        "created_at",
        "ticket_product_id",
        "order.*",
        "order.total",
        "order.currency_code",
        "order.subtotal",
        "order.tax_total",
      ],
      filters: {
        ticket_product_id: id,
      },
    })

    console.log("Found ticket purchases:", ticketPurchases?.length || 0)
    console.log("Sample ticket purchase:", ticketPurchases?.[0])
    console.log("Sample order data:", ticketPurchases?.[0]?.order)

    // Calculate statistics
    const totalRevenue = ticketPurchases.reduce((sum: number, purchase: any) => {
      const orderTotal = purchase.order?.total || 0
      console.log(`Purchase ${purchase.id}: order total = ${orderTotal}`)
      return sum + orderTotal
    }, 0)

    console.log("Total revenue calculated:", totalRevenue)

  const totalTicketsSold = ticketPurchases.length

  // Calculate total capacity
  let totalCapacity = 0
  if (ticketProduct.ticket_type === "general_access") {
    totalCapacity = ticketProduct.max_quantity || 0
  } else {
    // For seat-based tickets, count all seats
    const { data: venueRows } = await query.graph({
      entity: "venue_row",
      fields: ["id", "seats"],
      filters: {
        venue_id: ticketProduct.venue_id,
      },
    })
    
    totalCapacity = venueRows.reduce((sum: number, row: any) => {
      return sum + (row.seats?.length || 0)
    }, 0)
  }

  const percentageSold = totalCapacity > 0 ? (totalTicketsSold / totalCapacity) * 100 : 0

  // Get currency from first order
  const currency = ticketPurchases[0]?.order?.currency_code || "USD"

  // Group sales by date
  const salesByDate = ticketPurchases.reduce((acc: any, purchase: any) => {
    const date = new Date(purchase.show_date).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = {
        date,
        ticketsSold: 0,
        revenue: 0,
      }
    }
    acc[date].ticketsSold += 1
    acc[date].revenue += purchase.order?.total || 0
    return acc
  }, {})

  const salesByDateArray = Object.values(salesByDate).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

    res.json({
      show: {
        id: ticketProduct.id,
        name: product?.data?.[0]?.title || "Unknown Show",
        venue: ticketProduct.venue?.name || "Unknown Venue",
        ticket_type: ticketProduct.ticket_type,
        max_quantity: ticketProduct.max_quantity,
        dates: ticketProduct.dates,
      },
      statistics: {
        totalRevenue,
        totalTicketsSold,
        totalCapacity,
        percentageSold: Math.round(percentageSold * 100) / 100,
        currency,
        salesByDate: salesByDateArray,
      },
    })
  } catch (error) {
    console.error("Error in show stats endpoint:", error)
    res.status(500).json({ 
      message: "An error occurred while fetching show statistics",
      error: error.message 
    })
  }
}
