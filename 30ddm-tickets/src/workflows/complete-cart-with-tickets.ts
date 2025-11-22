import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { completeCartWorkflow, createRemoteLinkStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { createTicketPurchasesStep, CreateTicketPurchasesStepInput } from "./steps/create-ticket-purchases"
import { TICKET_BOOKING_MODULE } from "../modules/ticket-booking"
import { Modules } from "@medusajs/framework/utils"

export type CompleteCartWithTicketsWorkflowInput = {
  cart_id: string
}

export const completeCartWithTicketsWorkflow = createWorkflow(
  "complete-cart-with-tickets",
  (input: CompleteCartWithTicketsWorkflowInput) => {
    // Step 1: Complete the cart using Medusa's workflow
    const order = completeCartWorkflow.runAsStep({
      input: {
        id: input.cart_id,
      },
    })

    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      fields: [
        "id", 
        "items.*",
        "items.variant.*",
        "items.variant.options.*",
        "items.variant.options.option.*",
        "items.variant.ticket_product_variant.*",
        "items.variant.ticket_product_variant.ticket_product.*",
        "items.metadata",
        "total",
        "subtotal",
        "currency_code",
      ],
      filters: {
        id: input.cart_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    })

    // Debug cart data
    console.log('Cart data before completion:', {
      cart_id: carts[0]?.id,
      currency_code: carts[0]?.currency_code,
      items: Array.isArray(carts[0]?.items) ? carts[0]?.items?.map(item => item ? ({
        id: item.id,
        title: item.title,
        unit_price: item.unit_price,
        quantity: item.quantity,
        variant_id: item.variant_id
      }) : null) : carts[0]?.items
    })

    // Step 2: Create ticket purchases for ticket products
    const ticketPurchases = createTicketPurchasesStep({
      order_id: order.id,
      cart: carts[0],
    } as unknown as CreateTicketPurchasesStepInput)

    // Step 3: Link ticket purchases to the order
    const linkData = transform({
      order,
      ticketPurchases,
    }, (data) => {
      return data.ticketPurchases.map((purchase) => ({
        [TICKET_BOOKING_MODULE]: {
          ticket_purchase_id: purchase.id,
        },
        [Modules.ORDER]: {
          order_id: data.order.id,
        },
      }))
    })

    // Step 4: Create remote links
    createRemoteLinkStep(linkData)

    // Step 5: Fetch order details
    const { data: refetchedOrder } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "currency_code",
        "email",
        "customer.*",
        "billing_address.*",
        "payment_collections.*",
        "items.*",
        "total",
        "subtotal",
        "tax_total",
        "shipping_total",
        "discount_total",
        "created_at",
        "updated_at",
      ],
      filters: {
        id: order.id,
      },
    }).config({ name: "refetch-order" })

    // Debug order data
    console.log('Order after completion:', {
      id: refetchedOrder[0]?.id,
      total: refetchedOrder[0]?.total,
      subtotal: refetchedOrder[0]?.subtotal,
      currency_code: refetchedOrder[0]?.currency_code,
      items: Array.isArray(refetchedOrder[0]?.items) ? refetchedOrder[0]?.items?.map(item => item ? ({
        id: item.id,
        title: item.title,
        unit_price: item.unit_price,
        quantity: item.quantity
      }) : null) : refetchedOrder[0]?.items
    })

    return new WorkflowResponse({
      order: refetchedOrder[0],
    })
  }
)