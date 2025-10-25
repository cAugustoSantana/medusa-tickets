"use client"

import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { generateIndividualTicketPDF, generateCombinedTicketsPDF } from "@lib/util/pdf-generator"
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

interface PDFDownloadButtonsProps {
  order: HttpTypes.StoreOrder
  qrCodesData: OrderQRCodesResponse
}

const PDFDownloadButtons = ({ order, qrCodesData }: PDFDownloadButtonsProps) => {
  const [isGeneratingIndividual, setIsGeneratingIndividual] = useState(false)
  const [isGeneratingCombined, setIsGeneratingCombined] = useState(false)

  const handleDownloadIndividualPDFs = async () => {
    setIsGeneratingIndividual(true)
    try {
      // Generate individual PDFs for each ticket
      for (let i = 0; i < qrCodesData.qrCodes.length; i++) {
        await generateIndividualTicketPDF(order, qrCodesData.qrCodes[i], i + 1)
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error('Error generating individual PDFs:', error)
    } finally {
      setIsGeneratingIndividual(false)
    }
  }

  const handleDownloadCombinedPDF = async () => {
    setIsGeneratingCombined(true)
    try {
      await generateCombinedTicketsPDF(order, qrCodesData)
    } catch (error) {
      console.error('Error generating combined PDF:', error)
    } finally {
      setIsGeneratingCombined(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button 
        variant="secondary" 
        size="small"
        onClick={handleDownloadIndividualPDFs}
        disabled={isGeneratingIndividual || isGeneratingCombined}
        className="flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
        {isGeneratingIndividual ? 'Generating...' : 'Download Individual PDFs'}
      </Button>
      
      <Button 
        variant="secondary" 
        size="small"
        onClick={handleDownloadCombinedPDF}
        disabled={isGeneratingIndividual || isGeneratingCombined}
        className="flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
        {isGeneratingCombined ? 'Generating...' : 'Download Combined PDF'}
      </Button>
    </div>
  )
}

export default PDFDownloadButtons
