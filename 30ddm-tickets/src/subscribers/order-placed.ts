import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import QRCode from "qrcode"
import { Modules } from "@medusajs/framework/utils"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    // Get the query service to fetch order details
    const query = container.resolve("query")
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)
    
    // Fetch order details
    const { data: [order] } = await query.graph({
      entity: "order",
      fields: [
        "id", 
        "email", 
        "created_at",
        "total",
        "currency_code",
        "items.*",
        "items.product.*",
        "items.variant.*",
        "customer.*",
        "billing_address.*",
        "shipping_address.*",
      ],
      filters: {
        id: data.id,
      },
    })

    if (!order) {
      console.error(`Order not found: ${data.id}`)
      return
    }

    // Generate QR codes for each order item
    const qrCodes: Array<{
      itemId: string;
      qrCode: string;
      qrData: any;
      itemInfo: any;
    }> = []
    
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item?.id) {
          // Create QR code data for order item (simplified for better email compatibility)
          const qrData = {
            orderId: order.id,
            itemId: item.id,
            productTitle: item.product?.title,
            quantity: item.quantity,
            total: item.total,
            email: order.email,
          }

          // Generate QR code as data URL (base64) - smaller size for email compatibility
          const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 150,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'L'
          })

          qrCodes.push({
            itemId: item.id,
            qrCode: qrCodeDataURL,
            qrData: qrData,
            itemInfo: {
              productTitle: item.product?.title,
              variantTitle: item.variant?.title,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              total: item.total,
            }
          })

          console.log(`Generated QR code for order item: ${item.id}`)
        }
      }
    }

    console.log(`Order ${order.id} - Generated ${qrCodes.length} QR codes`)

    // Send email with QR codes
    if (order.email && qrCodes.length > 0) {
      try {
        console.log(`Preparing to send email to ${order.email} with ${qrCodes.length} QR codes`)
        
        await notificationModuleService.createNotifications({
          to: order.email,
          channel: "email",
          template: "order-placed",
          data: {
            order: {
              id: String(order.id),
              email: String(order.email),
              created_at: String(order.created_at),
              total: Number(order.total || 0),
              currency_code: String(order.currency_code || ''),
            },
            customer: {
              first_name: String(order.customer?.first_name || order.billing_address?.first_name || ''),
              last_name: String(order.customer?.last_name || order.billing_address?.last_name || ''),
            },
            items: qrCodes.map(qr => ({
              itemId: String(qr.itemId),
              qrCode: String(qr.qrCode), // Base64 QR code image
              productTitle: String(qr.itemInfo.productTitle || ''),
              variantTitle: String(qr.itemInfo.variantTitle || ''),
              quantity: Number(qr.itemInfo.quantity || 0),
              unitPrice: Number(qr.itemInfo.unitPrice || 0),
              total: Number(qr.itemInfo.total || 0),
              qrData: qr.qrData, // JSON data for validation
            })),
            totalItems: Number(qrCodes.length),
            billing_address: order.billing_address,
          },
        })

        console.log(`Order confirmation email sent to ${order.email} with ${qrCodes.length} QR codes`)
      } catch (emailError) {
        console.error('Error sending order confirmation email:', emailError)
      }
    }
    
  } catch (error) {
    console.error('Error processing order placed event:', data.id, error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}