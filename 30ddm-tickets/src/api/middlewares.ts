import { defineMiddlewares, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http"
import { CreateVenueSchema } from "./admin/venues/route"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { CreateTicketProductSchema } from "./admin/ticket-products/route"
import { GetTicketProductSeatsSchema } from "./store/ticket-products/[id]/seats/route"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/venues",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(createFindParams(), {
          isList: true,
          defaults: ["id", "name", "address", "rows.*"],
        }),
      ],
    },
    {
      matcher: "/admin/venues",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(CreateVenueSchema)],
    },
    {
      matcher: "/admin/ticket-products",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(CreateTicketProductSchema),
      ],
    },
    {
      matcher: "/admin/ticket-products",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(createFindParams(), {
          isList: true,
          defaults: [
            "id", 
            "product_id", 
            "venue_id", 
            "dates", 
            "venue.*", 
            "variants.*", 
            "product.*",
          ],
        }),
      ],
    },
    {
      matcher: "/store/ticket-products/:id/seats",
      methods: ["GET"],
      middlewares: [validateAndTransformQuery(GetTicketProductSeatsSchema, {})],
    },
    {
      matcher: "/admin/tickets",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(createFindParams(), {
          isList: true,
          defaults: [
            "id",
            "order_id", 
            "seat_number",
            "show_date",
            "status",
            "created_at",
            "updated_at",
          ],
        }),
      ],
    },
    {
      matcher: "/admin/shows/:id/stats",
      methods: ["GET"],
      middlewares: [],
    },
    {
      matcher: "/admin/shows/:id/tickets",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(createFindParams(), {
          isList: true,
          defaults: [
            "id",
            "order_id", 
            "seat_number",
            "show_date",
            "status",
            "created_at",
            "updated_at",
          ],
        }),
      ],
    },
  ],
})

