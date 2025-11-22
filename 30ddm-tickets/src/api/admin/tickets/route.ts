import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TICKET_BOOKING_MODULE } from "../../../modules/ticket-booking"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const ticketBookingModuleService = req.scope.resolve(TICKET_BOOKING_MODULE)
  const query = req.scope.resolve("query")

  const {
    limit = 15,
    offset = 0,
    order = "-created_at",
  } = (req as any).validatedQuery || {}

  // Normalize order string to ORM-friendly object
  let normalizedOrder: Record<string, "ASC" | "DESC"> | undefined
  if (typeof order === "string" && order.length) {
    normalizedOrder = {}
    for (const token of order.split(",")) {
      const trimmed = token.trim()
      if (!trimmed) continue
      const desc = trimmed.startsWith("-")
      const field = desc ? trimmed.slice(1) : trimmed
      if (field) {
        normalizedOrder[field] = desc ? "DESC" : "ASC"
      }
    }
  }

  // Fetch ticket purchases with related data
  const { data: ticketPurchases, metadata } = await query.graph({
    entity: "ticket_purchase",
    fields: [
      "id",
      "order_id",
      "seat_number",
      "show_date",
      "status",
      "created_at",
      "updated_at",
      "ticket_product.*",
      "ticket_product.product.*",
      "ticket_product.venue.*",
      "ticket_variant.*",
      "venue_row.*",
      "order.*",
      "order.total",
      "order.currency_code",
      "order.subtotal",
      "order.tax_total",
      "order.customer.*",
      "order.billing_address.*",
    ],
    filters: {},
    pagination: {
      take: limit,
      skip: offset,
      order: normalizedOrder,
    },
  })

  // Debug: Log sample ticket purchase data
  if (ticketPurchases.length > 0) {
    console.log('Sample ticket purchase order data:', {
      purchase_id: ticketPurchases[0].id,
      order_id: ticketPurchases[0].order_id,
      order_total: ticketPurchases[0].order?.total,
      order_currency: ticketPurchases[0].order?.currency_code,
      order_subtotal: ticketPurchases[0].order?.subtotal,
      order_tax_total: ticketPurchases[0].order?.tax_total,
      order_keys: Object.keys(ticketPurchases[0].order || {}),
      raw_purchase: ticketPurchases[0] // Log the entire purchase object
    })
  } else {
    console.log('No ticket purchases found')
  }

  // Transform the data to include buyer information
  const tickets = ticketPurchases.map((purchase: any) => ({
    id: purchase.id,
    order_id: purchase.order_id,
    seat_number: purchase.seat_number,
    show_date: purchase.show_date,
    status: purchase.status,
    created_at: purchase.created_at,
    updated_at: purchase.updated_at,
    product_name: purchase.ticket_product?.product?.title || "Unknown Product",
    venue_name: purchase.ticket_product?.venue?.name || "Unknown Venue",
    row_type: purchase.venue_row?.row_type || "general_access",
    buyer_name: purchase.order?.customer?.first_name && purchase.order?.customer?.last_name
      ? `${purchase.order.customer.first_name} ${purchase.order.customer.last_name}`
      : purchase.order?.billing_address?.first_name && purchase.order?.billing_address?.last_name
      ? `${purchase.order.billing_address.first_name} ${purchase.order.billing_address.last_name}`
      : "Unknown Buyer",
    buyer_email: purchase.order?.customer?.email || purchase.order?.email || "Unknown Email",
    is_validated: purchase.status === "scanned",
    order_total: purchase.order?.total,
    order_currency: purchase.order?.currency_code,
  }))

  res.json({
    tickets,
    count: metadata?.count || 0,
    limit,
    offset,
  })
}
