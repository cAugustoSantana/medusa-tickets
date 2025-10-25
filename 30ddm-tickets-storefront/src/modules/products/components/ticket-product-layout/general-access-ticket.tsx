"use client"

import { getTicketProductAvailability } from "@lib/data/ticket-products"
import { TicketProductAvailability } from "@lib/util/ticket-product"
import { HttpTypes } from "@medusajs/types"
import { Button, Label, IconButton, toast } from "@medusajs/ui"
import { Minus, Plus } from "@medusajs/icons"
import { useState, useEffect, useMemo } from "react"
import { addToCart } from "@lib/data/cart"
import { useParams } from "next/navigation"
import { convertToLocale } from "@lib/util/money"

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
        console.log('Availability data loaded:', data)
        console.log('Availability details:', data.availability.map(avail => ({
          date: avail.date,
          rowTypes: avail.row_types.map(rt => ({
            rowType: rt.row_type,
            availableSeats: rt.available_seats
          }))
        })))
        setAvailability(data.availability)
        
        // Auto-select date if there's only one available date
        if (data.availability.length === 1) {
          console.log('Auto-selecting single date:', data.availability[0].date)
          setSelectedDate(new Date(data.availability[0].date))
        }
      } catch (error) {
        console.error('Failed to load availability:', error)
        toast.error("Failed to load ticket availability: " + error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAvailability()
  }, [product.id])

  const dateAsStr = (date: Date) => {
    // Use UTC to avoid timezone issues
    return `${
      date.getUTCFullYear()
    }-${
      String(date.getUTCMonth() + 1).padStart(2, "0")
    }-${String(date.getUTCDate()).padStart(2, "0")}`
  }

  const getTotalAvailableTickets = (dateAvailability: TicketProductAvailability) => {
    const total = dateAvailability.row_types.reduce(
      (sum, rowType) => sum + rowType.available_seats, 0
    )
    console.log('getTotalAvailableTickets:', {
      dateAvailability,
      rowTypes: dateAvailability.row_types,
      total
    })
    return total
  }

  const getMaxTicketsForSelectedDate = () => {
    if (!selectedDate) return 10 // Default max
    
    // Try multiple date matching methods to handle format differences
    const selectedDateStr = dateAsStr(selectedDate)
    const dateAvailability = availability.find(avail => {
      const availDateStr = dateAsStr(new Date(avail.date))
      return avail.date === selectedDateStr || availDateStr === selectedDateStr
    })
    
    if (!dateAvailability) {
      console.log('No availability found for date:', {
        selectedDate: selectedDateStr,
        availableDates: availability.map(a => a.date)
      })
      return 10 // Default max
    }
    
    const maxTickets = Math.min(getTotalAvailableTickets(dateAvailability), 20) // Cap at 20 tickets max
    console.log('Max tickets for selected date:', {
      selectedDate: selectedDateStr,
      dateAvailability,
      maxTickets
    })
    
    return maxTickets
  }

  const getFilteredAvailability = (quantity: number) => {
    if (!selectedDate) return availability.filter((avail) => getTotalAvailableTickets(avail) >= quantity)
    
    // For single date events, only show availability for the selected date
    const selectedDateStr = dateAsStr(selectedDate)
    const filtered = availability.filter(avail => {
      const availDateStr = dateAsStr(new Date(avail.date))
      const isMatchingDate = avail.date === selectedDateStr || availDateStr === selectedDateStr
      const hasEnoughTickets = getTotalAvailableTickets(avail) >= quantity
      return isMatchingDate && hasEnoughTickets
    })
    
    console.log('Filtered availability:', {
      selectedDate: selectedDateStr,
      quantity,
      filtered: filtered.length,
      total: availability.length
    })
    
    return filtered
  }

  const filteredAvailability = getFilteredAvailability(nbOfTickets)

  // Calculate pricing
  const selectedVariant = useMemo(() => {
    if (!selectedDate) return null
    
    // Debug logging (can be removed in production)
    console.log('Finding variant for date:', {
      selectedDate: dateAsStr(selectedDate),
      variantCount: product.variants?.length,
      allVariants: product.variants?.map(v => ({
        id: v.id,
        title: v.title,
        date: Array.isArray(v.options) 
          ? v.options?.find(opt => opt.option?.title === "Date")?.value
          : v.options?.Date
      }))
    })
    
    const variant = product.variants?.find((v) => {
      // Handle both array and object option structures
      let variantDate
      if (Array.isArray(v.options)) {
        // Array structure (seat-based tickets)
        variantDate = v.options?.find((opt) => opt.option?.title === "Date")?.value
      } else {
        // Object structure (general access tickets)
        variantDate = v.options?.Date
      }
      
      // Try multiple date comparison methods
      const selectedDateStr = dateAsStr(selectedDate)
      const directMatch = variantDate === selectedDateStr
      
      // Also try comparing with the availability date format
      const availabilityDateStr = availability.find(avail => 
        dateAsStr(new Date(avail.date)) === selectedDateStr
      )?.date
      const availabilityMatch = variantDate === availabilityDateStr
      
      // Debug logging (can be removed in production)
      if (!directMatch && !availabilityMatch) {
        console.log('Date mismatch:', {
          lookingFor: selectedDateStr,
          variantDate: variantDate,
          availabilityDate: availabilityDateStr
        })
      }
      
      return directMatch || availabilityMatch
    })
    
    return variant
  }, [selectedDate, product.variants])

  const pricePerTicket = useMemo(() => {
    if (!selectedVariant) return 0
    
    // Try different price sources
    const calculatedPrice = selectedVariant.calculated_price?.calculated_amount
    const regularPrice = selectedVariant.prices?.[0]?.amount
    
    console.log('Pricing debug:', {
      selectedVariant,
      calculatedPrice,
      regularPrice,
      prices: selectedVariant.prices
    })
    
    return calculatedPrice || regularPrice || 0
  }, [selectedVariant])

  const totalPrice = useMemo(() => {
    return pricePerTicket * nbOfTickets
  }, [pricePerTicket, nbOfTickets])

  const currencyCode = selectedVariant?.prices?.[0]?.currency_code || "usd"

  // Debug logging
  console.log('General Access Ticket Debug:', {
    selectedDate,
    availability: availability.length,
    filteredAvailability: filteredAvailability.length,
    nbOfTickets,
    disabled,
    isAddingToCart,
    isLoading,
    selectedVariant: selectedVariant?.id,
    pricePerTicket,
    totalPrice,
    currencyCode
  })

  const handleAddToCart = async () => {
    if (!selectedDate) {
      toast.error("Please select a date")
      return
    }

    setIsAddingToCart(true)
    try {
      // Find the variant for the selected date
      const variant = product.variants?.find((v) => {
        // Handle both array and object option structures
        let variantDate
        if (Array.isArray(v.options)) {
          // Array structure (seat-based tickets)
          variantDate = v.options?.find((opt) => opt.option?.title === "Date")?.value
        } else {
          // Object structure (general access tickets)
          variantDate = v.options?.Date
        }
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
        {filteredAvailability.length === 1 && selectedDate ? "Select Number of Tickets" : "Select Show Date"}
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
              <Label htmlFor="nbOfTickets" className="text-ui-fg-subtle txt-compact-small">
                Number of Tickets {filteredAvailability.length === 1 ? `(Max: ${getMaxTicketsForSelectedDate()})` : ''}
              </Label>
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
                  onClick={() => setNbOfTickets(Math.min(getMaxTicketsForSelectedDate(), nbOfTickets + 1))}
                  disabled={disabled || nbOfTickets >= getMaxTicketsForSelectedDate()}
                  variant="transparent"
                >
                  <Plus />
                </IconButton>
              </div>
            </div>
          </div>

          {/* Show selected date if only one date available */}
          {filteredAvailability.length === 1 && selectedDate && (
            <div className="text-center bg-ui-bg-subtle rounded-lg p-3">
              <p className="txt-medium text-ui-fg-base font-semibold">
                📅 {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="txt-small text-ui-fg-subtle mt-1">
                Only one show date available
              </p>
            </div>
          )}

          {/* Available dates info */}
          {filteredAvailability.length > 1 && (
            <p className="txt-small text-ui-fg-subtle text-center txt-compact-small">
              {filteredAvailability.length} show${filteredAvailability.length !== 1 ? "s" : ""} available for {nbOfTickets} ticket${nbOfTickets !== 1 ? "s" : ""}
            </p>
          )}

          {/* Pricing Information */}
          {selectedDate && selectedVariant && (
            <div className="bg-ui-bg-subtle rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="txt-medium text-ui-fg-base">Price per ticket:</span>
                <span className="txt-medium text-ui-fg-base">
                  {convertToLocale({
                    amount: pricePerTicket,
                    currency_code: currencyCode,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="txt-medium text-ui-fg-base">Quantity:</span>
                <span className="txt-medium text-ui-fg-base">{nbOfTickets}</span>
              </div>
              <hr className="border-ui-border-base" />
              <div className="flex justify-between items-center">
                <span className="txt-large text-ui-fg-base font-semibold">Total:</span>
                <span className="txt-large text-ui-fg-base font-semibold">
                  {convertToLocale({
                    amount: totalPrice,
                    currency_code: currencyCode,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={(() => {
              const isDisabled = disabled || !selectedDate || filteredAvailability.length === 0 || isAddingToCart
              console.log('Button disabled check:', {
                disabled,
                noSelectedDate: !selectedDate,
                noFilteredAvailability: filteredAvailability.length === 0,
                isAddingToCart,
                isDisabled,
                selectedVariant: !!selectedVariant,
                pricePerTicket
              })
              return isDisabled
            })()}
            variant="primary"
            className="w-full"
            isLoading={isAddingToCart}
          >
            {isAddingToCart 
              ? "Adding to Cart..." 
              : `Add ${nbOfTickets} Ticket${nbOfTickets > 1 ? 's' : ''} to Cart - ${convertToLocale({
                  amount: totalPrice,
                  currency_code: currencyCode,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
            }
          </Button>

          {/* Single date event note */}
          {filteredAvailability.length === 1 && selectedDate && (
            <p className="txt-small text-ui-fg-subtle text-center">
              💡 This is a single-date event. The date has been automatically selected for you.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
