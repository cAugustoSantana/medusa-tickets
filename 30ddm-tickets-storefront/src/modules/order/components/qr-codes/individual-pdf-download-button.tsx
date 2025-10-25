"use client"

import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { generateIndividualTicketPDF } from "@lib/util/pdf-generator"
import { useState } from "react"

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

interface IndividualPDFDownloadButtonProps {
  order: HttpTypes.StoreOrder
  qrCode: QRCodeData
  ticketNumber: number
}

const IndividualPDFDownloadButton = ({ order, qrCode, ticketNumber }: IndividualPDFDownloadButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownloadPDF = async () => {
    setIsGenerating(true)
    try {
      await generateIndividualTicketPDF(order, qrCode, ticketNumber)
    } catch (error) {
      console.error('Error generating individual PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button 
      variant="secondary" 
      size="small"
      onClick={handleDownloadPDF}
      disabled={isGenerating}
      className="flex items-center gap-2"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      </svg>
      {isGenerating ? 'Generating...' : 'Download PDF'}
    </Button>
  )
}

export default IndividualPDFDownloadButton
