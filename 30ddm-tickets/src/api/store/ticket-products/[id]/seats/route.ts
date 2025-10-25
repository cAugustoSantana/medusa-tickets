import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"

export const GetTicketProductSeatsSchema = z.object({
  date: z.string(),
})

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const { date } = req.query
  const query = req.scope.resolve("query")

  if (!date) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Date parameter is required")
  }

  const { data: [ticketProduct] } = await query.graph({
    entity: "ticket_product",
    fields: [
      "id",
      "product_id",
      "dates",
      "venue.*",
      "venue.rows.*",
      "variants.*",
      "variants.product_variant.*",
      "variants.product_variant.options.*",
      "variants.product_variant.options.option.*",
      "variants.product_variant.ticket_product_variant.*",
      "variants.product_variant.ticket_product_variant.purchases.*",
      "variants.product_variant.ticket_product_variant.purchases.venue_row.*",
    ],
    filters: {
      product_id: id,
    },
  })

  console.log('Ticket product data:', JSON.stringify(ticketProduct, null, 2))

  // Normalize date for comparison
  const normalizeDate = (dateStr: string) => {
    // Convert to YYYY-MM-DD format for comparison
    const date = new Date(dateStr)
    return date.toISOString().split('T')[0]
  }

  const normalizedRequestedDate = normalizeDate(String(date))
  const normalizedAvailableDates = ticketProduct.dates.map(normalizeDate)

  console.log('Date normalization:', {
    requestedDate: date,
    normalizedRequestedDate,
    availableDates: ticketProduct.dates,
    normalizedAvailableDates,
    isValid: normalizedAvailableDates.includes(normalizedRequestedDate)
  })

  // Check if the requested date is valid for this ticket product
  if (!normalizedAvailableDates.includes(normalizedRequestedDate)) {
    console.log('Date validation failed after normalization:', {
      requestedDate: date,
      normalizedRequestedDate,
      availableDates: ticketProduct.dates,
      normalizedAvailableDates
    })
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid date for this ticket product")
  }

  // Build seat map for the requested date
  const seatMap = ticketProduct.venue.rows.map((row: any) => {
    // Find the variant for this date and row type
    const variant = ticketProduct.variants.find((v: any) => {
      const variantDate = v.product_variant.options.find((opt: any) => 
        opt.option?.title === "Date"
      )?.value
      const variantRowType = v.product_variant.options.find((opt: any) => 
        opt.option?.title === "Row Type"
      )?.value
      
      // Use normalized date for comparison
      const normalizedVariantDate = normalizeDate(variantDate)
      return normalizedVariantDate === normalizedRequestedDate && variantRowType === row.row_type
    })

    console.log(`Variant for row ${row.row_number} (${row.row_type}) on ${date}:`, {
      found: !!variant,
      variantId: variant?.id,
      productVariantId: variant?.product_variant?.id,
      purchases: variant?.product_variant?.ticket_product_variant?.purchases?.length || 0,
      allVariants: ticketProduct.variants.map((v: any) => ({
        id: v.id,
        rowType: v.product_variant?.options?.find((opt: any) => opt.option?.title === "Row Type")?.value,
        date: v.product_variant?.options?.find((opt: any) => opt.option?.title === "Date")?.value,
        purchases: v.product_variant?.ticket_product_variant?.purchases?.length || 0
      }))
    })

    // Generate seats for this row
    const seats: Array<{
      number: string
      is_purchased: boolean
      variant_id: string | null
    }> = []
    for (let i = 1; i <= row.seat_count; i++) {
      const seatNumber = i.toString()
      
      // Check if this seat is purchased
      const isPurchased = variant?.product_variant?.ticket_product_variant?.purchases?.some((purchase: any) => {
        // Convert both dates to the same format for comparison
        const purchaseDate = new Date(purchase.show_date).toISOString().split('T')[0]
        const requestedDate = normalizedRequestedDate
        
        return purchase.seat_number === seatNumber && 
               purchase.venue_row?.row_number === row.row_number &&
               purchaseDate === requestedDate
      }) || false

      console.log(`Seat ${seatNumber} in row ${row.row_number}:`, {
        isPurchased,
        purchases: variant?.product_variant?.ticket_product_variant?.purchases,
        variant: variant?.product_variant?.id,
        rowId: row.id,
        seatNumber,
        rowNumber: row.row_number,
        requestedDate: date,
        purchaseDetails: variant?.product_variant?.ticket_product_variant?.purchases?.map((p: any) => ({
          seat_number: p.seat_number,
          row_number: p.venue_row?.row_number,
          show_date: p.show_date,
          purchaseDate: new Date(p.show_date).toISOString().split('T')[0],
          requestedDate: normalizedRequestedDate
        }))
      })

      seats.push({
        number: seatNumber,
        is_purchased: isPurchased,
        variant_id: variant?.product_variant?.id || null,
      })
    }

    return {
      row_number: row.row_number,
      row_type: row.row_type,
      seats,
    }
  })

  return res.json({
    venue: {
      id: ticketProduct.venue.id,
      name: ticketProduct.venue.name,
      address: ticketProduct.venue.address,
      rows: ticketProduct.venue.rows,
    },
    date,
    seat_map: seatMap,
  })
}
