import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { validateVenueAvailabilityStep } from "./steps/validate-venue-availability"
import createTicketProductsStep, { createTicketProductsStep as namedCreateTicketProductsStep } from "./steps/create-ticket-products"
import { useQueryGraphStep, createProductsWorkflow, createRemoteLinkStep, createInventoryItemsWorkflow } from "@medusajs/medusa/core-flows"
import { CreateProductWorkflowInputDTO, CreateMoneyAmountDTO } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { TICKET_BOOKING_MODULE } from "../modules/ticket-booking"
import { RowType } from "../modules/ticket-booking/models/venue-row"
import { TicketType } from "../modules/ticket-booking/models/ticket-product"
import createTicketProductVariantsStep, { createTicketProductVariantsStep as namedCreateTicketProductVariantsStep } from "./steps/create-ticket-product-variants"

export type CreateTicketProductWorkflowInput = {
  name: string
  venue_id: string
  dates: string[]
  ticket_type: TicketType
  max_quantity?: number
  variants: Array<{
    row_type: RowType
    seat_count: number
    prices: CreateMoneyAmountDTO[]
  }>
}

export const createTicketProductWorkflow = createWorkflow(
  "create-ticket-product",
  (input: CreateTicketProductWorkflowInput) => {
    validateVenueAvailabilityStep({
      venue_id: input.venue_id,
      dates: input.dates,
    })

    const { data: stores } = useQueryGraphStep({
      entity: "store",
      fields: ["id", "default_location_id", "default_sales_channel_id"],
    })

    const inventoryItemsData = transform({
        input,
        stores,
      }, (data) => {
        const inventoryItems: any[] = []
        
        for (const date of data.input.dates) {
          for (const variant of data.input.variants) {
            // For general access tickets, use total capacity instead of seat count
            const quantity = data.input.ticket_type === TicketType.GENERAL_ACCESS 
              ? variant.seat_count // Use seat_count as total capacity for general access
              : variant.seat_count
            
            inventoryItems.push({
              sku: `${data.input.name}-${date}-${variant.row_type}`,
              title: `${data.input.name} - ${date} - ${variant.row_type}`,
              description: data.input.ticket_type === TicketType.GENERAL_ACCESS
                ? `General access ticket for ${data.input.name} on ${date}`
                : `Ticket for ${data.input.name} on ${date} in ${variant.row_type} seating`,
              location_levels: [{
                location_id: data.stores[0].default_location_id,
                stocked_quantity: quantity,
              }],
              requires_shipping: false,
            })
          }
        }
        
        return inventoryItems
      })
      
      const inventoryItems = createInventoryItemsWorkflow.runAsStep({
        input: {
          items: inventoryItemsData,
        },
      })
      
      const productData = transform({
        input,
        inventoryItems,
        stores,
      }, (data) => {
        const rowTypes = data.input.ticket_type === TicketType.GENERAL_ACCESS 
          ? ["general_access"]
          : [...new Set(
              data.input.variants.map((variant: any) => variant.row_type)
            )]
        
        const product: CreateProductWorkflowInputDTO = {
          title: data.input.name,
          status: "published",
          options: [
            {
              title: "Date",
              values: data.input.dates,
            },
            {
              title: "Row Type", 
              values: rowTypes,
            },
          ],
          variants: [] as any[],
        }
      
        if (data.stores[0].default_sales_channel_id) {
          product.sales_channels = [
            {
              id: data.stores[0].default_sales_channel_id,
            },
          ]
        }
      
        // Create variants for each date and row type combination
        let inventoryIndex = 0
        for (const date of data.input.dates) {
          if (data.input.ticket_type === TicketType.GENERAL_ACCESS) {
            // For general access, create a single variant per date
            product.variants!.push({
              title: `${data.input.name} - ${date} - General Access`,
              options: {
                Date: date,
                "Row Type": "general_access",
              },
              manage_inventory: true,
              inventory_items: [{
                inventory_item_id: data.inventoryItems[inventoryIndex].id,
              }],
              prices: data.input.variants[0].prices, // Use first variant's prices for general access
            })
            inventoryIndex++
          } else {
            // For seat-based tickets, create variants for each row type
            for (const variant of data.input.variants) {
              product.variants!.push({
                title: `${data.input.name} - ${date} - ${variant.row_type}`,
                options: {
                  Date: date,
                  "Row Type": variant.row_type,
                },
                manage_inventory: true,
                inventory_items: [{
                  inventory_item_id: data.inventoryItems[inventoryIndex].id,
                }],
                prices: variant.prices,
              })
              inventoryIndex++
            }
          }
        }
      
        return [product]
      })
      
      const medusaProduct = createProductsWorkflow.runAsStep({
        input: {
          products: productData,
        },
      })
      
      const ticketProductData = transform({
        medusaProduct,
        input,
      }, (data) => {
        return {
          ticket_products: data.medusaProduct.map((product: any) => ({
            product_id: product.id,
            venue_id: data.input.venue_id,
            dates: data.input.dates,
            ticket_type: data.input.ticket_type,
            max_quantity: data.input.max_quantity,
          })),
        }
      })
      
      const { ticket_products } = (createTicketProductsStep || namedCreateTicketProductsStep)(
        ticketProductData
      )
      
      const ticketVariantsData = transform({
        medusaProduct,
        ticket_products,
        input,
      }, (data) => {
        return {
          variants: data.medusaProduct[0].variants.map((variant: any) => {
            const rowType = variant.options.find(
              (opt: any) => opt.option?.title === "Row Type"
            )?.value
            return {
              ticket_product_id: data.ticket_products[0].id,
              product_variant_id: variant.id,
              row_type: rowType,
            }
          }),
        }
      })
      
      const { ticket_product_variants } = (createTicketProductVariantsStep || namedCreateTicketProductVariantsStep)(
        ticketVariantsData
      )
      
      const linksData = transform({
        medusaProduct,
        ticket_products,
        ticket_product_variants,
      }, (data) => {
        // Create links between ticket product and Medusa product
        const productLinks = [{
          [TICKET_BOOKING_MODULE]: {
            ticket_product_id: data.ticket_products[0].id,
          },
          [Modules.PRODUCT]: {
            product_id: data.medusaProduct[0].id,
          },
        }]
      
        // Create links between ticket variants and Medusa variants
        const variantLinks = data.ticket_product_variants.map((variant) => ({
          [TICKET_BOOKING_MODULE]: {
            ticket_product_variant_id: variant.id,
          },
          [Modules.PRODUCT]: {
            product_variant_id: variant.product_variant_id,
          },
        }))
      
        return [...productLinks, ...variantLinks]
      })
      
      createRemoteLinkStep(linksData)
      
      const { data: finalTicketProduct } = useQueryGraphStep({
        entity: "ticket_product",
        fields: [
          "id",
          "product_id",
          "venue_id",
          "dates",
          "venue.*",
          "product.*",
          "variants.*",
        ],
        filters: {
          id: ticket_products[0].id,
        },
      }).config({ name: "retrieve-ticket-product" })
      
      return new WorkflowResponse({
        ticket_product: finalTicketProduct[0],
      })
  }
)