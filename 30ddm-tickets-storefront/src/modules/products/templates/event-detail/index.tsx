"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { addToCart } from "@lib/data/cart"
import { getProductPrice } from "@lib/util/get-product-price"
import { useParams } from "next/navigation"
import { toast } from "@medusajs/ui"

type EventDetailProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}

export default function EventDetail({ product, region }: EventDetailProps) {
  const params = useParams()
  const router = useRouter()
  const countryCode = params.countryCode as string

  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Extract event information
  const category = product.collection?.title || product.metadata?.category as string || "Event"
  const venue = product.metadata?.venue_name as string || "TBA"
  const eventDate = product.variants?.[0]?.options?.find(
    (opt: any) => opt.option?.title === "Date"
  )?.value || product.metadata?.event_date as string

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return {
        full: date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      }
    } catch {
      return null
    }
  }

  const dateInfo = eventDate ? formatDate(eventDate) : null

  // Group variants by ticket type (Row Type option)
  const ticketTypes = useMemo(() => {
    const types: Record<string, {
      id: string
      name: string
      price: number
      currency: string
      variant: HttpTypes.StoreProductVariant
      inventory: number
    }> = {}

    product.variants?.forEach((variant) => {
      // Handle both array and object option structures
      let rowType = "Standard"
      if (Array.isArray(variant.options)) {
        rowType = variant.options?.find(
          (opt: any) => opt.option?.title === "Row Type"
        )?.value || "Standard"
      } else if (variant.options && typeof variant.options === 'object') {
        rowType = (variant.options as any)["Row Type"] || "Standard"
      }

      // Use the first variant for each row type (or you could aggregate)
      if (!types[rowType]) {
        // calculated_price is an object with calculated_amount property
        const priceAmount = variant.calculated_price?.calculated_amount || 
                           variant.calculated_price?.amount || 
                           0
        const currencyCode = variant.calculated_price?.currency_code || 
                            region.currency_code || 
                            "USD"
        
        types[rowType] = {
          id: variant.id,
          name: rowType === "general_access" ? "General Admission" : 
                rowType.charAt(0).toUpperCase() + rowType.slice(1).replace(/_/g, " "),
          price: typeof priceAmount === 'number' ? priceAmount : parseFloat(priceAmount) || 0,
          currency: currencyCode,
          variant,
          inventory: variant.inventory_quantity || 0,
        }
      }
    })

    return Object.values(types)
  }, [product.variants, region.currency_code])

  const getTotalPrice = () => {
    return Object.entries(selectedTickets).reduce((total, [variantId, quantity]) => {
      const ticketType = ticketTypes.find((t) => t.variant.id === variantId)
      return total + (ticketType ? ticketType.price * quantity : 0)
    }, 0)
  }

  const getTotalQuantity = () => {
    return Object.values(selectedTickets).reduce((a, b) => a + b, 0)
  }

  const getTotalAvailability = () => {
    return ticketTypes.reduce((total, type) => total + type.inventory, 0)
  }

  const handleAddToCart = async () => {
    if (getTotalQuantity() === 0) {
      toast.error("Please select at least one ticket")
      return
    }

    setIsAddingToCart(true)
    try {
      for (const [variantId, quantity] of Object.entries(selectedTickets)) {
        if (quantity > 0) {
          await addToCart({
            variantId,
            quantity,
            countryCode,
          })
        }
      }

      toast.success(`${getTotalQuantity()} ticket${getTotalQuantity() !== 1 ? "s" : ""} added to cart`)
    } catch (error) {
      toast.error("Failed to add tickets to cart")
      console.error(error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleCheckout = async () => {
    if (getTotalQuantity() === 0) {
      toast.error("Please select at least one ticket")
      return
    }

    setIsCheckingOut(true)
    try {
      await handleAddToCart()
      router.push(`/${countryCode}/checkout`)
    } catch (error) {
      setIsCheckingOut(false)
    }
  }

  const imageUrl = product.thumbnail || product.images?.[0]?.url

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Event Hero Image */}
        <div className="mb-8">
          <div className="relative w-full h-80 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.title || "Event"}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Event Info - Left Column */}
          <div className="flex-1">
            <div className="mb-4">
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1">
                {category}
              </Badge>
            </div>

            <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              {product.title}
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              {product.description}
            </p>

            <div className="space-y-3 mb-8">
              {dateInfo && (
                <div className="flex items-center gap-3 text-lg">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300">
                    {dateInfo.full} at {dateInfo.time}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-lg">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-slate-700 dark:text-slate-300">{venue}</span>
              </div>
              <div className="flex items-center gap-3 text-lg">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-slate-700 dark:text-slate-300">
                  {product.metadata?.attendees as string || "0"} people attending
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" size="lg" className="gap-2 bg-transparent">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </Button>
              <Button variant="outline" size="lg" className="gap-2 bg-transparent">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Save
              </Button>
            </div>
          </div>

          {/* Ticket Selection Card - Right Column */}
          <div className="md:w-96">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Select Tickets</CardTitle>
                <CardDescription>{getTotalAvailability()} tickets available</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Ticket Types */}
                <div className="space-y-4">
                  {ticketTypes.map((ticketType) => (
                    <div key={ticketType.id} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{ticketType.name}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {ticketType.inventory} available
                          </p>
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          ${ticketType.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedTickets((prev) => ({
                              ...prev,
                              [ticketType.id]: Math.max(0, (prev[ticketType.id] || 0) - 1),
                            }))
                          }
                          disabled={!selectedTickets[ticketType.id] || selectedTickets[ticketType.id] === 0}
                        >
                          −
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max={ticketType.inventory}
                          value={selectedTickets[ticketType.id] || 0}
                          onChange={(e) =>
                            setSelectedTickets((prev) => ({
                              ...prev,
                              [ticketType.id]: Math.min(
                                ticketType.inventory,
                                Math.max(0, Number.parseInt(e.target.value) || 0),
                              ),
                            }))
                          }
                          className="text-center w-16"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedTickets((prev) => ({
                              ...prev,
                              [ticketType.id]: Math.min(
                                ticketType.inventory,
                                (prev[ticketType.id] || 0) + 1,
                              ),
                            }))
                          }
                          disabled={(selectedTickets[ticketType.id] || 0) >= ticketType.inventory}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Total Tickets:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{getTotalQuantity()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-slate-900 dark:text-white">Total Price:</span>
                    <span className="text-slate-900 dark:text-white">
                      ${getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={getTotalQuantity() === 0 || isCheckingOut}
                    onClick={handleCheckout}
                  >
                    {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    disabled={getTotalQuantity() === 0 || isAddingToCart}
                    onClick={handleAddToCart}
                  >
                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

