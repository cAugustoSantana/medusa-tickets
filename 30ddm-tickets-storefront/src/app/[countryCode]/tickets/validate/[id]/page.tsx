"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@medusajs/ui"
import { sdk } from "@lib/config"

interface TicketValidationData {
  valid: boolean
  ticket: {
    id: string
    seat: string
    row: string
    rowType: string
    showDate: string
    venue: string
    venueAddress: string
    product: string
    customer: {
      name: string
      email: string
    }
    orderId: string
    orderDisplayId: string
  }
  message: string
  scannedAt: string
}

export default function TicketValidationPage() {
  const params = useParams()
  const ticketId = params.id as string
  const [ticketData, setTicketData] = useState<TicketValidationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateTicket = async () => {
      try {
        setLoading(true)
        // Use the SDK to call the backend API with proper authentication
        const response = await sdk.client.fetch(`/store/tickets/validate/${ticketId}`, {
          method: 'GET',
        })
        
        setTicketData(response)
      } catch (err) {
        console.error('Ticket validation error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (ticketId) {
      validateTicket()
    }
  }, [ticketId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-fg-interactive mx-auto mb-4"></div>
          <p className="txt-medium text-ui-fg-subtle">Validating ticket...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-ui-tag-red-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="txt-large-plus mb-2">Invalid Ticket</h1>
          <p className="txt-medium text-ui-fg-subtle mb-6">{error}</p>
          <Button 
            variant="secondary" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="txt-medium text-ui-fg-subtle">No ticket data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ui-bg-subtle py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-ui-tag-green-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="txt-large-plus mb-2">Valid Ticket</h1>
            <p className="txt-medium text-ui-fg-subtle">{ticketData.message}</p>
          </div>

          {/* Ticket Details */}
          <div className="space-y-6">
            <div className="border-b border-ui-border-base pb-6">
              <h2 className="txt-large mb-4">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="txt-small text-ui-fg-subtle">Event</p>
                  <p className="txt-medium font-semibold">{ticketData.ticket.product}</p>
                </div>
                <div>
                  <p className="txt-small text-ui-fg-subtle">Date</p>
                  <p className="txt-medium font-semibold">
                    {new Date(ticketData.ticket.showDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="txt-small text-ui-fg-subtle">Venue</p>
                  <p className="txt-medium font-semibold">{ticketData.ticket.venue}</p>
                  {ticketData.ticket.venueAddress && (
                    <p className="txt-small text-ui-fg-subtle">{ticketData.ticket.venueAddress}</p>
                  )}
                </div>
                <div>
                  <p className="txt-small text-ui-fg-subtle">Seat</p>
                  <p className="txt-medium font-semibold">
                    Row {ticketData.ticket.row}, Seat {ticketData.ticket.seat}
                  </p>
                  <p className="txt-small text-ui-fg-subtle">{ticketData.ticket.rowType}</p>
                </div>
              </div>
            </div>

            <div className="border-b border-ui-border-base pb-6">
              <h2 className="txt-large mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="txt-small text-ui-fg-subtle">Name</p>
                  <p className="txt-medium font-semibold">{ticketData.ticket.customer.name}</p>
                </div>
                <div>
                  <p className="txt-small text-ui-fg-subtle">Email</p>
                  <p className="txt-medium font-semibold">{ticketData.ticket.customer.email}</p>
                </div>
                <div>
                  <p className="txt-small text-ui-fg-subtle">Order ID</p>
                  <p className="txt-medium font-semibold">#{ticketData.ticket.orderDisplayId}</p>
                </div>
                <div>
                  <p className="txt-small text-ui-fg-subtle">Ticket ID</p>
                  <p className="txt-small text-ui-fg-subtle font-mono">{ticketData.ticket.id}</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="txt-small text-ui-fg-subtle">
                Validated on {new Date(ticketData.scannedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
