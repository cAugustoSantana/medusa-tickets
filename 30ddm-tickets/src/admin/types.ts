export enum RowType {
  PREMIUM = "premium",
  BALCONY = "balcony",
  STANDARD = "standard",
  VIP = "vip"
}

export interface VenueRow {
  id: string
  row_number: string
  row_type: RowType
  seat_count: number
  venue_id: string
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  name: string
  address?: string
  rows: VenueRow[]
  created_at: string
  updated_at: string
}

export interface CreateVenueRequest {
  name: string
  address?: string
  rows: {
    row_number: string
    row_type: RowType
    seat_count: number
  }[]
}

export interface VenuesResponse {
  venues: Venue[]
  count: number
  limit: number
  offset: number
}
export interface TicketPurchase {
  id: string
  order_id: string
  seat_number: string
  show_date: string
  status: "pending" | "scanned"
  created_at: string
  updated_at: string
  product_name: string
  venue_name: string
  row_type: string
  buyer_name: string
  buyer_email: string
  is_validated: boolean
  order_total: number
  order_currency: string
}

export interface TicketsResponse {
  tickets: TicketPurchase[]
  count: number
  limit: number
  offset: number
}

export interface ShowStats {
  show: {
    id: string
    name: string
    venue: string
    ticket_type: string
    max_quantity?: number
    dates: string[]
  }
  statistics: {
    totalRevenue: number
    totalTicketsSold: number
    totalCapacity: number
    percentageSold: number
    currency: string
    salesByDate: Array<{
      date: string
      ticketsSold: number
      revenue: number
    }>
  }
}

export interface TicketProduct {
  id: string
  product_id: string
  venue_id: string
  dates: string[]
  ticket_type: string
  max_quantity?: number
  venue: {
    id: string
    name: string
    address?: string
  }
  product: {
    id: string
    title: string
  }
  variants: Array<{
    id: string
    row_type: string
  }>
  created_at: string
  updated_at: string
}