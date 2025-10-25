"use client"

import { getTicketProductAvailability } from "@lib/data/ticket-products"
import { TicketProductAvailability } from "@lib/util/ticket-product"
import { HttpTypes } from "@medusajs/types"
import { Button, Label, IconButton, toast } from "@medusajs/ui"
import { Minus, Plus } from "@medusajs/icons"
import { useState, useEffect } from "react"
import { addToCart } from "@lib/data/cart"
import { useParams } from "next/navigation"

type GeneralAccessTicketProps = {
  product: HttpTypes.StoreProduct
  disabled?: boolean
}

export default function GeneralAccessTicket({
  product,
  disabled = false,
}: GeneralAccessTicketProps) {
  const [nbOfTickets, setNbOfTickets] = useState(1)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availability, setAvailability] = useState<TicketProductAvailability[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  const countryCode = useParams().countryCode as string

  // Load availability data on mount
  useEffect(() => {
    const loadAvailability = async () => {
      setIsLoading(true)
      try {
        const data = await getTicketProductAvailability(product.id)
        setAvailability(data.availability)
        
        // Auto-select date if there's only one available date
        if (data.availability.length === 1) {
          setSelectedDate(new Date(data.availability[0].date))
        }
      } catch (error) {
        toast.error("Failed to load ticket availability: " + error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAvailability()
  }, [product.id])

  const getTotalAvailableTickets = (dateAvailability: TicketProductAvailability) => {
    return dateAvailability.row_types.reduce(
      (sum, rowType) => sum + rowType.available_seats, 0
    )
  }

  const getFilteredAvailability = (quantity: number) => {
    return availability.filter((avail) => getTotalAvailableTickets(avail) >= quantity)
  }

  const filteredAvailability = getFilteredAvailability(nbOfTickets)

  const dateAsStr = (date: Date) => {
    return `${
      date.getFullYear()
    }-${
      String(date.getMonth() + 1).padStart(2, "0")
    }-${String(date.getDate()).padStart(2, "0")}`
  }

  const handleAddToCart = async () => {
    if (!selectedDate) {
      toast.error("Please select a date")
      return
    }

    setIsAddingToCart(true)
    try {
      // Find the variant for the selected date
      const variant = product.variants?.find((v) => {
        const variantDate = v.options?.find((opt) => opt.option?.title === "Date")?.value
        return variantDate === dateAsStr(selectedDate)
      })

      if (!variant) {
        toast.error("No tickets available for the selected date")
        return
      }

      // Add to cart with general access metadata
      await addToCart({
        variantId: variant.id,
        quantity: nbOfTickets,
        countryCode,
        metadata: {
          ticket_type: "general_access",
          show_date: dateAsStr(selectedDate),
        }
      })

      toast.success(`${nbOfTickets} general access ticket${nbOfTickets > 1 ? 's' : ''} added to cart`)
    } catch (error) {
      toast.error("Failed to add tickets to cart: " + error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <div className="bg-ui-bg-base">
      <h3 className="txt-large text-center mb-4">
        {filteredAvailability.length === 1 ? "Select Number of Tickets" : "Select Show Date"}
      </h3>
      {isLoading && (
        <div className="flex flex-col gap-y-4">
          <div className="h-6 bg-ui-bg-subtle rounded animate-pulse w-32 mx-auto" />
          <div className="h-10 bg-ui-bg-subtle rounded animate-pulse w-48 mx-auto" />
          <div className="h-6 bg-ui-bg-subtle rounded animate-pulse w-40 mx-auto" />
        </div>
      )}
      {!isLoading && (
        <div className="flex flex-col gap-y-4">
          {/* Number of tickets selection */}
          <div className="flex justify-center">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="nbOfTickets" className="text-ui-fg-subtle txt-compact-small">Number of Tickets</Label>
              <div className="flex items-center justify-between rounded-md">
                <IconButton
                  onClick={() => setNbOfTickets(Math.max(1, nbOfTickets - 1))}
                  disabled={disabled || nbOfTickets <= 1}
                  variant="transparent"
                >
                  <Minus />
                </IconButton>
                {nbOfTickets}
                <IconButton
                  onClick={() => setNbOfTickets(Math.min(10, nbOfTickets + 1))}
                  disabled={disabled || nbOfTickets >= 10}
                  variant="transparent"
                >
                  <Plus />
                </IconButton>
              </div>
            </div>
          </div>

          {/* Show selected date if only one date available */}
          {filteredAvailability.length === 1 && selectedDate && (
            <div className="text-center">
              <p className="txt-medium text-ui-fg-base">
                Show Date: {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}

          {/* Available dates info */}
          {filteredAvailability.length > 0 && (
            <p className="txt-small text-ui-fg-subtle text-center txt-compact-small">
              {filteredAvailability.length === 1 
                ? `1 show available for ${nbOfTickets} ticket${nbOfTickets !== 1 ? "s" : ""}`
                : `${filteredAvailability.length} show${filteredAvailability.length !== 1 ? "s" : ""} available for ${nbOfTickets} ticket${nbOfTickets !== 1 ? "s" : ""}`
              }
            </p>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={disabled || !selectedDate || filteredAvailability.length === 0 || isAddingToCart}
            variant="primary"
            className="w-full"
            isLoading={isAddingToCart}
          >
            {isAddingToCart ? "Adding to Cart..." : "Add to Cart"}
          </Button>
        </div>
      )}
    </div>
  )
}
