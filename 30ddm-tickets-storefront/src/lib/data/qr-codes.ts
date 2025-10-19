"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

type QRCodeData = {
  itemId: string
  qrCode: string
  qrData: any
  itemInfo: {
    productTitle: string
    variantTitle: string
    quantity: number
    unitPrice: number
    total: number
  }
}

type OrderQRCodesResponse = {
  orderId: string
  orderDisplayId: string
  customerEmail: string
  qrCodes: QRCodeData[]
  totalItems: number
}

export const getOrderQRCodes = async (orderId: string): Promise<OrderQRCodesResponse | null> => {
  try {
    // Use the SDK to make the API call with proper authentication
    const response = await sdk.client.fetch<OrderQRCodesResponse>(
      `/store/orders/${orderId}/qr-codes`,
      {
        method: "GET",
        cache: "no-store", // Don't cache QR codes
      }
    )

    return response
  } catch (error) {
    console.error('Error fetching QR codes:', error)
    return null
  }
}
