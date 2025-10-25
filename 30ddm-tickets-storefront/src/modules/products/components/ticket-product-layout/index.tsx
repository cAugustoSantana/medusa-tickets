"use client"

import React, { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import TicketDateSelection from "./date-quantity-selection"
import SeatSelectionModal from "./seat-selection-modal"
import GeneralAccessTicket from "./general-access-ticket"

type TicketLayoutProps = {
  product: HttpTypes.StoreProduct
}

const TicketLayout: React.FC<TicketLayoutProps> = ({ product }) => {
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)

  // Check if this is a general access ticket
  // For now, we'll determine this based on product metadata or variant options
  const isGeneralAccess = product.metadata?.ticket_type === "general_access" || 
    product.variants?.some(v => 
      v.options?.some(opt => 
        opt.option?.title === "Row Type" && opt.value === "general_access"
      )
    )

  const handleDateQuantitySelect = (date: string, quantity: number) => {
    setSelectedDate(date)
    setSelectedQuantity(quantity)
    setIsSeatModalOpen(true)
  }

  const handleCloseSeatModal = () => {
    setIsSeatModalOpen(false)
    setSelectedDate(null)
    setSelectedQuantity(1)
  }

  // Show general access component for general access tickets
  if (isGeneralAccess) {
    return <GeneralAccessTicket product={product} disabled={false} />
  }

  // Show seat selection for seat-based tickets
  return (
    <>
      <TicketDateSelection
        product={product}
        onDateSelect={handleDateQuantitySelect}
        disabled={false}
      />
      
      <SeatSelectionModal
        product={product}
        selectedDate={selectedDate || ""}
        selectedQuantity={selectedQuantity}
        isOpen={isSeatModalOpen}
        onClose={handleCloseSeatModal}
        disabled={false}
      />
    </>
  )
}

export default TicketLayout