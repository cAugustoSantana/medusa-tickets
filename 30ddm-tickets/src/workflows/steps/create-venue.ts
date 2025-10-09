import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TICKET_BOOKING_MODULE } from "../../modules/ticket-booking"

export type CreateVenueStepInput = {
  name: string
  address?: string
}

export const createVenueStep = createStep(
  "create-venue",
    async (input: CreateVenueStepInput, { container }) => {
    if (!input?.name) {
      throw new Error("create-venue: 'name' is required")
    }

     const ticketBookingModuleService /* : TicketBookingModuleService */ =
      container.resolve(TICKET_BOOKING_MODULE)

    // If your service expects an ARRAY, pass [input]
    const venue = await ticketBookingModuleService.createVenues(input) 

    return new StepResponse(venue, venue)

  },
  async (venue, { container }) => {
    if (!venue) {return}

    const ticketBookingModuleService = container.resolve(TICKET_BOOKING_MODULE)
    
    await ticketBookingModuleService.deleteVenues(venue.id)
  }
)