import { 
  createDataTableColumnHelper, 
  DataTable, 
  useDataTable, 
  DataTablePaginationState,
  Badge,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { sdk } from "../../../../lib/sdk"
import { TicketPurchase, TicketsResponse } from "../../../../types"

interface ShowTicketsTableProps {
  showId: string
}

const ShowTicketsTable = ({ showId }: ShowTicketsTableProps) => {
  const navigate = useNavigate()
  const columnHelper = createDataTableColumnHelper<TicketPurchase>()
  const limit = 15
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  })

  const offset = useMemo(() => {
    return pagination.pageIndex * limit
  }, [pagination])

  const { data, isLoading } = useQuery<TicketsResponse>({
    queryKey: ["show-tickets", showId, offset, limit],
    queryFn: () => sdk.client.fetch(`/admin/shows/${showId}/tickets`, {
      query: {
        offset: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
        order: "-created_at",
      },
    }),
    enabled: !!showId,
  })

  const handleRowClick = (row: TicketPurchase) => {
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
    <DataTable instance={table}>
      <DataTable.Table className="cursor-pointer" />
      <DataTable.Pagination />
    </DataTable>
  )
}

export default ShowTicketsTable
