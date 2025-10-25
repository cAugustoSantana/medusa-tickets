import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Receipt } from "@medusajs/icons"
import { 
  createDataTableColumnHelper, 
  Container, 
  DataTable, 
  useDataTable, 
  Heading, 
  DataTablePaginationState,
  Badge,
  Button,
} from "@medusajs/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { sdk } from "../../lib/sdk"
import { TicketPurchase, TicketsResponse } from "../../types"

const TicketsPage = () => {
  const navigate = useNavigate()
  const columnHelper = createDataTableColumnHelper<TicketPurchase>()
  const limit = 15
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  })

  const queryClient = useQueryClient()

  const offset = useMemo(() => {
    return pagination.pageIndex * limit
  }, [pagination])

  const { data, isLoading } = useQuery<TicketsResponse>({
    queryKey: ["tickets", offset, limit],
    queryFn: () => sdk.client.fetch("/admin/tickets", {
      query: {
        offset: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
        order: "-created_at",
      },
    }),
  })

  const handleRowClick = (row: TicketPurchase) => {
    console.log('Clicked row data:', row)
    console.log('Order ID:', row.order_id)
    if (!row.order_id) {
      console.error('Order ID is undefined for ticket:', row.id)
      return
    }
    navigate(`/app/orders/${row.order_id}`)
  }

  const columns = [
    columnHelper.accessor("buyer_name", {
      header: "Buyer",
      cell: ({ row }) => (
        <div>
          <div className="txt-small-plus font-medium">{row.original.buyer_name}</div>
          <div className="txt-small text-gray-500">{row.original.buyer_email}</div>
        </div>
      ),
    }),
    columnHelper.accessor("product_name", {
      header: "Event",
      cell: ({ row }) => (
        <div>
          <div className="txt-small-plus">{row.original.product_name}</div>
          <div className="txt-small text-gray-500">{row.original.venue_name}</div>
        </div>
      ),
    }),
    columnHelper.accessor("show_date", {
      header: "Show Date",
      cell: ({ row }) => (
        <span className="txt-small-plus">
          {new Date(row.original.show_date).toLocaleDateString()}
        </span>
      ),
    }),
    columnHelper.accessor("seat_number", {
      header: "Seat",
      cell: ({ row }) => {
        const seat = row.original.seat_number
        const rowType = row.original.row_type
        
        if (seat === "GA") {
          return <Badge color="blue" size="small">General Access</Badge>
        }
        
        return (
          <div>
            <div className="txt-small-plus">{seat}</div>
            <div className="txt-small text-gray-500 capitalize">{rowType}</div>
          </div>
        )
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: ({ row }) => {
        const isScanned = row.original.status === "scanned"
        return (
          <Badge 
            color={isScanned ? "green" : "orange"} 
            size="small"
          >
            {isScanned ? "Validated" : "Pending"}
          </Badge>
        )
      },
    }),
    columnHelper.accessor("order_total", {
      header: "Order Total",
      cell: ({ row }) => {
        const total = row.original.order_total
        const currency = row.original.order_currency
        
        if (!total || !currency) return <span className="text-gray-400">-</span>
        
        const formatter = new Intl.NumberFormat([], {
          style: "currency",
          currency: currency.toUpperCase(),
        })
        
        return (
          <span className="txt-small-plus">
            {formatter.format(total / 100)}
          </span>
        )
      },
    }),
    columnHelper.accessor("created_at", {
      header: "Purchased",
      cell: ({ row }) => (
        <span className="txt-small text-gray-500">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    }),
  ]

  const table = useDataTable({
    columns,
    data: data?.tickets || [],
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    getRowId: (row) => row.id,
    onRowClick: handleRowClick,
  })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <Heading>
            All Tickets
          </Heading>
          <div className="flex items-center gap-2">
            <span className="txt-small text-gray-500">
              {data?.count || 0} total tickets
            </span>
          </div>
        </DataTable.Toolbar>
        <DataTable.Table className="cursor-pointer" />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Tickets",
  icon: Receipt,
})

export default TicketsPage
