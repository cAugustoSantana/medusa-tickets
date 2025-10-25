import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { 
  CartDTO, 
  CartLineItemDTO, 
  ProductVariantDTO,
  InferTypeOf,
} from "@medusajs/framework/types"
import { TICKET_BOOKING_MODULE } from "../../modules/ticket-booking"
import TicketProductVariant from "../../modules/ticket-booking/models/ticket-product-variant"

export type CreateTicketPurchasesStepInput = {
  order_id: string
  cart: CartDTO & {
    items: CartLineItemDTO & {
      variant?: ProductVariantDTO & {
        ticket_product_variant?: InferTypeOf<typeof TicketProductVariant>
      }
    }[]
  }
}

// Helper function to find or create a general access venue row
async function findOrCreateGeneralAccessRow(
  ticketProductId: string,
  ticketBookingModuleService: any
): Promise<string> {
  // Get the ticket product to find the venue
  const ticketProduct = await ticketBookingModuleService.retrieveTicketProduct(ticketProductId)
  
  if (!ticketProduct?.venue_id) {
    throw new Error('No venue found for ticket product')
  }

  // Look for existing general access row
  const existingRows = await ticketBookingModuleService.listVenueRows({
    venue_id: ticketProduct.venue_id,
    row_type: 'general_access'
  })

  if (existingRows.length > 0) {
    return existingRows[0].id
  }

  // Create a new general access row
  const generalAccessRows = await ticketBookingModuleService.createVenueRows([{
    venue_id: ticketProduct.venue_id,
    row_number: 'GA',
    row_type: 'general_access',
    seat_count: 1000 // Large capacity for general access
  }])

  return generalAccessRows[0].id
}

export const createTicketPurchasesStep = createStep(
  "create-ticket-purchases",
  async (input: CreateTicketPurchasesStepInput, { container }) => {
    const { order_id, cart } = input
    console.log('Creating ticket purchases for order:', order_id)
    console.log('Cart items:', cart.items?.map(item => ({
      id: item.id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      metadata: item.metadata
    })))
    
    const ticketBookingModuleService = container.resolve(TICKET_BOOKING_MODULE)

    const ticketPurchasesToCreate: {
      order_id: string
      ticket_product_id: string
      ticket_variant_id: string
      venue_row_id: string | undefined
      seat_number: string
      show_date: Date
    }[] = []

    // Process each item in the cart
    for (const item of cart.items) {
      if (!item?.variant?.ticket_product_variant) { continue }

      // Check if this is a general access ticket
      const isGeneralAccess = item?.metadata?.ticket_type === "general_access"

      if (isGeneralAccess) {
        // For general access tickets, get date from metadata or variant options
        let showDate: string
        
        if (item?.metadata?.show_date) {
          // Get date from metadata (preferred for general access)
          showDate = item.metadata.show_date
        } else {
          // Fallback to variant options
          const variantDate = Array.isArray(item?.variant.options) 
            ? item?.variant.options.find((option: any) => option.option.title === "Date")?.value
            : item?.variant.options?.Date
          showDate = variantDate
        }
        
        if (!showDate) {
          console.error('No show date found for general access ticket:', item)
          continue
        }

        // For general access tickets, find or create a general access venue row
        const generalAccessRowId = await findOrCreateGeneralAccessRow(
          item.variant.ticket_product_variant.ticket_product_id,
          ticketBookingModuleService
        )

        ticketPurchasesToCreate.push({
          order_id,
          ticket_product_id: item.variant.ticket_product_variant.ticket_product_id,
          ticket_variant_id: item.variant.ticket_product_variant.id,
          venue_row_id: generalAccessRowId,
          seat_number: "GA", // General Access
          show_date: new Date(showDate),
        })
      } else {
        // For seat-based tickets, require seat selection metadata
        if (!item?.metadata?.venue_row_id || !item?.metadata?.seat_number) { continue }

        // Get date from variant options (handle both array and object structures)
        const variantDate = Array.isArray(item?.variant.options) 
          ? item?.variant.options.find((option: any) => option.option.title === "Date")?.value
          : item?.variant.options?.Date
        
        if (!variantDate) {
          console.error('No show date found for seat-based ticket:', item)
          continue
        }

        ticketPurchasesToCreate.push({
          order_id,
          ticket_product_id: item.variant.ticket_product_variant.ticket_product_id,
          ticket_variant_id: item.variant.ticket_product_variant.id,
          venue_row_id: item?.metadata.venue_row_id as string,
          seat_number: item?.metadata.seat_number as string,
          show_date: new Date(variantDate),
        })
      }
    }

    console.log('Ticket purchases to create:', ticketPurchasesToCreate)
    
    const ticketPurchases = await ticketBookingModuleService.createTicketPurchases(
      ticketPurchasesToCreate
    )
    
    console.log('Created ticket purchases:', ticketPurchases?.map(tp => ({
      id: tp.id,
      order_id: tp.order_id,
      seat_number: tp.seat_number,
      show_date: tp.show_date
    })))
    
    return new StepResponse(
      ticketPurchases,
      ticketPurchases
    )
  },
  async (ticketPurchases, { container }) => {
    if (!ticketPurchases) {return}

    const ticketBookingModuleService = container.resolve(TICKET_BOOKING_MODULE)

    // Delete the created ticket purchases
    await ticketBookingModuleService.deleteTicketPurchases(
      ticketPurchases.map((ticketPurchase) => ticketPurchase.id)
    )
  }
)