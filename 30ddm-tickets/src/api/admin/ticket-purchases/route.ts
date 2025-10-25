import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data: ticketPurchases } = await query.graph({
    entity: "ticket_purchase",
    ...req.queryConfig,
    fields: [
      "id",
      "order_id",
      "seat_number",
      "show_date",
      "status",
      "ticket_product.*",
      "ticket_variant.*",
      "venue_row.*",
    ],
  })

  res.json({
    ticket_purchases: ticketPurchases,
    count: ticketPurchases.length,
  })
}
