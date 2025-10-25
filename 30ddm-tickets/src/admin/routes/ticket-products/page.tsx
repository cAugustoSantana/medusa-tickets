import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ReceiptPercent } from "@medusajs/icons"
import {
  createDataTableColumnHelper,
  Container,
  DataTable,
  useDataTable,
  Heading,
  DataTablePaginationState,
  Badge,
  Button,
  toast,
} from "@medusajs/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import React, { useState, useMemo } from "react"
import { sdk } from "../../lib/sdk"
import { TicketProduct } from "../../types"
import { CreateTicketProductModal } from "../../components/create-ticket-product-modal"

const TicketProductsPage = () => {
    const navigate = useNavigate()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<TicketProduct | null>(null)
    const [quantity, setQuantity] = useState<number>(0)
    const limit = 15
    const [pagination, setPagination] = useState<DataTablePaginationState>({
      pageSize: limit,
      pageIndex: 0,
    })
  
    const queryClient = useQueryClient()

    const columnHelper = createDataTableColumnHelper<TicketProduct>()

    const columns = [
      columnHelper.accessor("product.title", {
        header: "Name",
        cell: ({ row }) => (
          <div 
            className="cursor-pointer hover:text-blue-600"
            onClick={() => navigate(`/shows/${row.original.id}`)}
          >
            {row.original.product?.title || "Unknown Product"}
          </div>
        ),
      }),
      columnHelper.accessor("venue.name", {
        header: "Venue",
      }),
      columnHelper.accessor("dates", {
        header: "Dates",
        cell: ({ row }) => {
          const dates = row.original.dates || []
          // Show first and last dates
          const displayDates = [dates[0], dates[dates.length - 1]]
          return (
            <div className="flex flex-wrap gap-1 items-center">
              {displayDates.map((date, index) => (
                <React.Fragment key={date}>
                  <Badge color="grey" size="small">
                    {new Date(date).toLocaleDateString()}
                  </Badge>
                  {index < displayDates.length - 1 && (
                    <span className="text-gray-500 txt-small">
                      -
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )
        },
      }),
      columnHelper.accessor("ticket_type", {
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.ticket_type
          return (
            <Badge color={type === "general_access" ? "blue" : "grey"} size="small">
              {type === "general_access" ? "General Access" : "Seat Based"}
            </Badge>
          )
        },
      }),
      columnHelper.accessor("max_quantity", {
        header: "Max Quantity",
        cell: ({ row }) => {
          const product = row.original
          if (product.ticket_type !== "general_access") {
            return <span className="text-gray-400">-</span>
          }
          
          return (
            <div className="flex items-center gap-2">
              <span className="txt-small-plus">
                {product.max_quantity || "Not set"}
              </span>
              <Button
                size="small"
                variant="secondary"
                onClick={() => handleUpdateQuantity(product)}
              >
                Edit
              </Button>
            </div>
          )
        },
      }),
      columnHelper.accessor("product_id", {
        header: "Actions",
        cell: ({ row }) => {
          return (
            <div className="flex gap-2">
              <Link to={`/products/${row.original.product_id}`}>
                View Product Details
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/shows/${row.original.id}`)
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View Dashboard
              </button>
            </div>
          )
        },
      }),
    ]
  
    const offset = useMemo(() => {
      return pagination.pageIndex * limit
    }, [pagination])
  
    const { data, isLoading } = useQuery<{
      ticket_products: TicketProduct[]
      count: number
      limit: number
      offset: number
    }>({
      queryKey: ["ticket-products", offset, limit],
      queryFn: () => sdk.client.fetch("/admin/ticket-products", {
        query: {
          offset: pagination.pageIndex * pagination.pageSize,
          limit: pagination.pageSize,
          order: "-created_at",
        },
      }),
    })
  
  const table = useDataTable({
    columns,
    data: data?.ticket_products || [],
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    getRowId: (row) => row.id,
  })
    
    const handleCloseModal = () => {
        setIsModalOpen(false)
      }
    
    const handleCreateTicketProduct = async (data: any) => {
        try {
          await sdk.client.fetch("/admin/ticket-products", {
            method: "POST",
            body: data,
            credentials: "include",
          })
          queryClient.invalidateQueries({ queryKey: ["ticket-products"] })
          handleCloseModal()
        } catch (error: any) {
          toast.error(`Failed to create show: ${error.message}`)
        }
      }

    const handleUpdateQuantity = (product: TicketProduct) => {
        setSelectedProduct(product)
        setQuantity(product.max_quantity || 0)
        setIsQuantityModalOpen(true)
      }

    const handleSaveQuantity = async () => {
        if (!selectedProduct) return

        try {
          await sdk.client.fetch(`/admin/ticket-products/${selectedProduct.id}/max-quantity`, {
            method: "PUT",
            body: { max_quantity: quantity },
            credentials: "include",
          })
          queryClient.invalidateQueries({ queryKey: ["ticket-products"] })
          setIsQuantityModalOpen(false)
          setSelectedProduct(null)
          toast.success("Max quantity updated successfully")
        } catch (error: any) {
          toast.error(`Failed to update quantity: ${error.message}`)
        }
      }

    const handleCloseQuantityModal = () => {
        setIsQuantityModalOpen(false)
        setSelectedProduct(null)
        setQuantity(0)
      }
    


    
    return (
      <Container className="divide-y p-0">
        <DataTable instance={table}>
          <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <Heading>
              Shows
            </Heading>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}> Create Show </Button>
          </DataTable.Toolbar>
          <DataTable.Table />
          <CreateTicketProductModal open={isModalOpen} onOpenChange={handleCloseModal} onSubmit={handleCreateTicketProduct}/>
          <DataTable.Pagination />
        </DataTable>
        
        {/* Quantity Edit Modal */}
        {isQuantityModalOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">
                Edit Max Quantity - {selectedProduct.product.title}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter max quantity"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set to 0 to use venue capacity as default
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleCloseQuantityModal}>
                  Cancel
                </Button>
                <Button onClick={handleSaveQuantity}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    )
  }

export const config = defineRouteConfig({
  label: "Shows",
  icon: ReceiptPercent,
})

export default TicketProductsPage