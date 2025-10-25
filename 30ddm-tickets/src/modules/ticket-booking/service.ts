import { promiseAll, MedusaService } from "@medusajs/framework/utils"
import QRCode from "qrcode"
import Venue from "./models/venue"
import VenueRow from "./models/venue-row"
import TicketProduct from "./models/ticket-product"
import TicketProductVariant from "./models/ticket-product-variant"
import TicketPurchase from "./models/ticket-purchase"
import { getTicketValidationUrl } from "../../lib/util/url"

class TicketBookingModuleService extends MedusaService({
  Venue,
  VenueRow,
  TicketProduct,
  TicketProductVariant,
  TicketPurchase,
}) {
  async generateTicketQRCodes(
    ticketPurchaseIds: string[]
  ): Promise<Record<string, string>> {
    const ticketPurchases = await this.listTicketPurchases({
      id: ticketPurchaseIds,
    })
    const qrCodeData: Record<string, string> = {}

    await promiseAll(
      ticketPurchases.map(async (ticketPurchase) => {
        // Create a structured QR code data with ticket information
        const qrData = {
          ticketId: ticketPurchase.id,
          seatNumber: ticketPurchase.seat_number,
          rowNumber: ticketPurchase.venue_row?.row_number,
          showDate: ticketPurchase.show_date,
          venue: ticketPurchase.venue_row?.venue?.name,
          product: ticketPurchase.ticket_product?.product_id, // Use product_id instead of nested product
          // Add a validation URL (dynamic based on environment)
          validationUrl: getTicketValidationUrl(ticketPurchase.id),
          // Add a simple text representation for basic scanning
          text: `Ticket: ${ticketPurchase.venue_row?.venue?.name} - Row ${ticketPurchase.venue_row?.row_number}, Seat ${ticketPurchase.seat_number} - ${ticketPurchase.show_date}`
        }

        // Generate QR code with JSON data
        const qrCodeString = JSON.stringify(qrData)
        qrCodeData[ticketPurchase.id] = await QRCode.toDataURL(qrCodeString, {
          errorCorrectionLevel: 'M',
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
      })
    )

    return qrCodeData
  }
}

export default TicketBookingModuleService