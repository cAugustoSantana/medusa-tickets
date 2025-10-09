import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createVenueWorkflow } from "../../../workflows/create-venue"
import { RowType } from "../../../modules/ticket-booking/models/venue-row"
import { TICKET_BOOKING_MODULE } from "../../../modules/ticket-booking"
import { z } from "zod"

export const CreateVenueSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  rows: z.array(z.object({
    row_number: z.string(),
    row_type: z.nativeEnum(RowType),
    seat_count: z.number(),
  })),
})

type CreateVenueSchema = z.infer<typeof CreateVenueSchema>

export async function POST(
  req: MedusaRequest<CreateVenueSchema>,
  res: MedusaResponse
) {
  const { result } = await createVenueWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json(result)
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const ticketBookingModuleService = req.scope.resolve(TICKET_BOOKING_MODULE)

  const {
    limit = 15,
    offset = 0,
    order,
  } = (req as any).validatedQuery || {}

  // Normalize order string (e.g., "-created_at,name") to ORM-friendly object
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

  const [venues, count] = await ticketBookingModuleService.listAndCountVenues(
    {},
    {
      relations: ["rows"],
      take: limit,
      skip: offset,
      order: normalizedOrder,
    }
  )

  res.json({ venues, count, limit, offset })
}