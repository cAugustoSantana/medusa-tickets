import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { TICKET_BOOKING_MODULE } from "../modules/ticket-booking"

export default async function handleOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")
  const notificationModuleService = container.resolve("notification")
  const ticketBookingModuleService = container.resolve(TICKET_BOOKING_MODULE)

  const { data: [order] } = await query.graph({
    entity: "order",
    fields: [
      "id", 
      "email", 
      "created_at",
      "currency_code",
      "total",
      "subtotal",
      "tax_total",
      "item_total",
      "shipping_total",
      "items.*",
      "ticket_purchases.*",
      "ticket_purchases.ticket_product.*",
      "ticket_purchases.ticket_product.product.*",
      "ticket_purchases.ticket_product.venue.*",
      "ticket_purchases.venue_row.*",
      "ticket_purchases.venue_row.venue.*",
      "customer.*",
      "billing_address.*",
      "shipping_methods.*",
    ],
    filters: {
      id: data.id,
    },
  })

  const ticketPurchaseIds: string[] = order.ticket_purchases?.
    map((purchase) => purchase?.id).filter(Boolean) as string[] || []

  const qrCodes = await ticketBookingModuleService.generateTicketQRCodes(
    ticketPurchaseIds
  )
  const firstTicketPurchase = order.ticket_purchases?.[0]

  // Helper function to extract numeric value from BigNumberValue
  const extractPrice = (price: any): number => {
    if (typeof price === "number") return price
    if (typeof price === "string") return parseFloat(price) || 0
    if (price?.value) return parseFloat(price.value) || 0
    if (price?.amount) return parseFloat(price.amount) || 0
    if (price?.calculated_amount) return parseFloat(price.calculated_amount) || 0
    return 0
  }

  await notificationModuleService.createNotifications({
    to: order.email || "",
    channel: "email",
    template: "order-placed",
    data: {
      order: {
        ...order,
        display_id: order.id,
        currency_code: order.currency_code || "USD", // Fallback currency
        total: extractPrice(order.total),
        subtotal: extractPrice(order.subtotal),
        tax_total: extractPrice(order.tax_total),
        item_total: extractPrice(order.item_total),
        shipping_total: extractPrice(order.shipping_total),
        customer: order.customer,
        billing_address: order.billing_address,
        shipping_address: order.billing_address, // Use billing as shipping for tickets
        shipping_methods: order.shipping_methods?.map(method => ({
          ...method,
          total: extractPrice(method?.total),
          subtotal: extractPrice(method?.subtotal),
        })) || [],
      },
      items: order.ticket_purchases?.map((purchase, index) => {
        // Find the corresponding order item for pricing
        let orderItem = order.items?.find(item => 
          item && item.metadata?.seat_number === purchase?.seat_number &&
          item.metadata?.row_number === purchase?.venue_row?.row_number
        )
        
        // For general access tickets, try to match by ticket_type metadata
        if (!orderItem && purchase?.seat_number === "GA") {
          orderItem = order.items?.find(item => 
            item && item.metadata?.ticket_type === "general_access"
          )
        }
        
        // If no specific order item found, use the first item as fallback
        const fallbackItem = order.items?.[0]
        const itemToUse = orderItem || fallbackItem
        
        const unitPrice = extractPrice(itemToUse?.unit_price) || 0
        const total = extractPrice(itemToUse?.total) || 0
        
        // Debug logging
        console.log('Ticket item pricing debug:', {
          itemId: purchase?.id,
          originalUnitPrice: itemToUse?.unit_price,
          extractedUnitPrice: unitPrice,
          originalTotal: itemToUse?.total,
          extractedTotal: total,
          itemToUse: itemToUse
        })
        
        return {
          itemId: purchase?.id || `item_${index}`,
          qrCode: qrCodes[purchase?.id || ""] || "",
          productTitle: firstTicketPurchase?.ticket_product?.product?.title || "Event Ticket",
          variantTitle: purchase?.venue_row?.row_type === "general_access" ? "General Access" : (purchase?.venue_row?.row_type || "General"),
          quantity: 1,
          unitPrice: unitPrice,
          total: total,
          qrData: {
            seat: purchase?.seat_number,
            row: purchase?.venue_row?.row_number,
            show_date: purchase?.show_date,
            venue: firstTicketPurchase?.ticket_product?.venue?.name,
          },
        }
      }) || [],
      totalItems: order.ticket_purchases?.length || 0,
      customer: {
        first_name: order.customer?.first_name || 
          order.billing_address?.first_name,
        last_name: order.customer?.last_name || 
          order.billing_address?.last_name,
      },
      billing_address: order.billing_address,
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}