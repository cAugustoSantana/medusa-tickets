import { Heading, Text } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { getOrderQRCodes } from "@lib/data/qr-codes"
import PrintButton from "./print-button"

type QRCodeData = {
  itemId: string
  qrCode: string
  qrData: any
  itemInfo: {
    productTitle: string
    variantTitle: string
    quantity: number
    unitPrice: number
    total: number
  }
}

type OrderQRCodesResponse = {
  orderId: string
  orderDisplayId: string
  customerEmail: string
  qrCodes: QRCodeData[]
  totalItems: number
}

type OrderQRCodesProps = {
  order: HttpTypes.StoreOrder
}

const OrderQRCodes = async ({ order }: OrderQRCodesProps) => {
  const qrCodesData = await getOrderQRCodes(order.id)

  if (!qrCodesData) {
    return (
      <div className="flex flex-col gap-4">
        <Heading level="h2" className="text-2xl font-semibold">
          Your Order QR Codes
        </Heading>
        <Text className="text-red-500">
          Failed to load QR codes. Please try refreshing the page.
        </Text>
      </div>
    )
  }

  const { qrCodes } = qrCodesData

  if (qrCodes.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Heading level="h2" className="text-2xl font-semibold">
          Your Order QR Codes
        </Heading>
        <Text className="text-ui-fg-muted">
          No QR codes available for this order.
        </Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Heading level="h2" className="text-2xl font-semibold">
        Your Order QR Codes
      </Heading>
      <Text className="text-ui-fg-muted mb-4">
        Each QR code below contains your order item information. 
        You can use these QR codes for returns, exchanges, or order verification.
      </Text>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {qrCodes.map((qr, index) => (
          <div 
            key={qr.itemId} 
            className="border border-ui-border-base rounded-lg p-4 bg-ui-bg-subtle hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* QR Code */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 border border-ui-border-base rounded-lg bg-white p-2 flex items-center justify-center">
                  <img
                    src={qr.qrCode}
                    alt={`QR Code for item ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              {/* Item Info */}
              <div className="flex-1 flex flex-col justify-center gap-2">
                <Text className="font-medium text-ui-fg-base">
                  Item {index + 1}
                </Text>
                <Text className="text-ui-fg-base">
                  <strong>Product:</strong> {qr.itemInfo.productTitle}
                </Text>
                {qr.itemInfo.variantTitle && (
                  <Text className="text-ui-fg-muted text-sm">
                    <strong>Variant:</strong> {qr.itemInfo.variantTitle}
                  </Text>
                )}
                <Text className="text-ui-fg-muted text-sm">
                  <strong>Quantity:</strong> {qr.itemInfo.quantity}
                </Text>
                <Text className="text-ui-fg-muted text-sm">
                  <strong>Total:</strong> €{(qr.itemInfo.total / 100).toFixed(2)}
                </Text>
                <Text className="text-xs text-ui-fg-muted mt-2">
                  Order: {order.id} | Item: {qr.itemId}
                </Text>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-4 bg-ui-bg-subtle border border-ui-border-base rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Text className="text-sm text-ui-fg-muted">
            <strong>Instructions:</strong> Save these QR codes or print them out. 
            You can use them for returns, exchanges, or order verification at our store.
          </Text>
          <PrintButton />
        </div>
      </div>
    </div>
  )
}

export default OrderQRCodes
