import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { 
  Container, 
  Heading, 
  Text,
  Badge,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { sdk } from "../../../lib/sdk"
import { ShowStats } from "../../../types"
import ShowTicketsTable from "./components/show-tickets-table"

const ShowDashboard = () => {
  const { id } = useParams<{ id: string }>()
  
  const { data: stats, isLoading } = useQuery<ShowStats>({
    queryKey: ["show-stats", id],
    queryFn: () => sdk.client.fetch(`/admin/shows/${id}/stats`),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center p-8">
          <Text>Loading show statistics...</Text>
        </div>
      </Container>
    )
  }

  if (!stats) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center p-8">
          <Text>Show not found</Text>
        </div>
      </Container>
    )
  }

  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat([], {
      style: "currency",
      currency: currency.toUpperCase(),
    })
    return formatter.format(amount / 100)
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div>
          <Heading level="h1">{stats.show.name}</Heading>
          <Text className="text-gray-500 mt-1">
            {stats.show.venue} • {stats.show.ticket_type === "general_access" ? "General Access" : "Seat-Based"}
          </Text>
        </div>
        <Badge color="blue" size="small">
          {stats.show.dates.length} {stats.show.dates.length === 1 ? "Date" : "Dates"}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Revenue */}
          <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-ui-fg-muted text-sm">Total Revenue</Text>
                <Text className="text-2xl font-semibold text-ui-fg-base">
                  {formatCurrency(stats.statistics.totalRevenue, stats.statistics.currency)}
                </Text>
              </div>
              <div className="text-green-500 text-2xl">💰</div>
            </div>
          </div>

          {/* Tickets Sold */}
          <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-ui-fg-muted text-sm">Tickets Sold</Text>
                <Text className="text-2xl font-semibold text-ui-fg-base">
                  {stats.statistics.totalTicketsSold} / {stats.statistics.totalCapacity}
                </Text>
                <Text className="text-xs text-ui-fg-muted">
                  {stats.statistics.percentageSold}% sold
                </Text>
              </div>
              <div className="text-blue-500 text-2xl">🎫</div>
            </div>
          </div>

          {/* Sales Progress */}
          <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Text className="text-ui-fg-muted text-sm mb-2">Sales Progress</Text>
                <div className="w-full bg-ui-bg-subtle-hover rounded-full h-2 mb-2">
                  <div 
                    className="bg-ui-bg-interactive h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(stats.statistics.percentageSold, 100)}%` }}
                  ></div>
                </div>
                <Text className="text-xs text-ui-fg-muted">
                  {stats.statistics.totalCapacity - stats.statistics.totalTicketsSold} tickets remaining
                </Text>
              </div>
              <div className="text-purple-500 text-2xl ml-4">📊</div>
            </div>
          </div>
        </div>

        {/* Sales by Date */}
        {stats.statistics.salesByDate.length > 0 && (
          <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-4 mb-6">
            <Heading level="h3" className="mb-4 text-ui-fg-base">Sales by Date</Heading>
            <div className="space-y-3">
              {stats.statistics.salesByDate.map((daySales) => (
                <div key={daySales.date} className="flex items-center justify-between p-3 bg-ui-bg-subtle-hover rounded">
                  <div>
                    <Text className="font-medium text-ui-fg-base">
                      {new Date(daySales.date).toLocaleDateString()}
                    </Text>
                    <Text className="text-sm text-ui-fg-muted">
                      {daySales.ticketsSold} tickets sold
                    </Text>
                  </div>
                  <Text className="font-semibold text-ui-fg-base">
                    {formatCurrency(daySales.revenue, stats.statistics.currency)}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tickets Table */}
      <div className="p-6">
        <Heading level="h3" className="mb-4 text-ui-fg-base">Tickets for this Show</Heading>
        <ShowTicketsTable showId={id!} />
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Show Dashboard",
  icon: ChartBar,
})

export default ShowDashboard
