"use client"

import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { printTickets } from "@lib/util/print-tickets"
import { useState } from "react"

type OrderQRCodesResponse = {
  orderId: string
  orderDisplayId: string
  customerEmail: string
  qrCodes: Array<{
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
  }>
  totalItems: number
}

interface PrintButtonProps {
  order: HttpTypes.StoreOrder
  qrCodesData: OrderQRCodesResponse
}

const PrintButton = ({ order, qrCodesData }: PrintButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false)

  const handlePrint = async () => {
    setIsGenerating(true)
    try {
      await printTickets(order, qrCodesData)
    } catch (error) {
      console.error('Error printing tickets:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button 
      variant="secondary" 
      size="small"
      onClick={handlePrint}
      disabled={isGenerating}
    >
      {isGenerating ? 'Generating...' : 'Print Tickets'}
    </Button>
  )
}

export default PrintButton
