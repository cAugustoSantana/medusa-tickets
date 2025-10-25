import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"

const UpdateMaxQuantitySchema = z.object({
  max_quantity: z.number().int().min(0).optional(),
})

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const query = req.scope.resolve("query")
  const ticketBookingModuleService = req.scope.resolve("ticketBookingModuleService")

  // Validate request body
  const { max_quantity } = UpdateMaxQuantitySchema.parse(req.body)

  // Get the ticket product
  const { data: [ticketProduct] } = await query.graph({
    entity: "ticket_product",
    fields: ["id", "product_id", "ticket_type", "max_quantity"],
    filters: {
      id: id,
    },
  })

  if (!ticketProduct) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Ticket product not found")
  }

  // Only allow updating max_quantity for general access tickets
  if (ticketProduct.ticket_type !== "general_access") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA, 
      "Max quantity can only be set for general access tickets"
    )
  }

  // Update the ticket product
  await ticketBookingModuleService.updateTicketProducts(id, {
    max_quantity: max_quantity,
  })

  return res.json({
    success: true,
    max_quantity: max_quantity,
  })
}
