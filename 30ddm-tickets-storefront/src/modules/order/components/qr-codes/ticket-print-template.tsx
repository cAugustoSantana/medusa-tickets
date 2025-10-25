import React from "react"
import { HttpTypes } from "@medusajs/types"

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

interface TicketPrintTemplateProps {
  order: HttpTypes.StoreOrder
  qrCodesData: OrderQRCodesResponse
}

const TicketPrintTemplate: React.FC<TicketPrintTemplateProps> = ({
  order,
  qrCodesData,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatShowDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="ticket-print-template">
      <style jsx>{`
        .ticket-print-template {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        
        .ticket-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
        }
        
        .ticket-header h1 {
          font-size: 28px;
          margin: 0 0 10px 0;
          color: #000;
        }
        
        .ticket-header p {
          font-size: 16px;
          margin: 5px 0;
          color: #666;
        }
        
        .ticket-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .ticket-card {
          border: 2px solid #000;
          border-radius: 8px;
          padding: 20px;
          background: white;
          page-break-inside: avoid;
        }
        
        .ticket-number {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #000;
        }
        
        .ticket-info {
          margin-bottom: 20px;
        }
        
        .ticket-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .ticket-info-label {
          font-weight: bold;
          color: #333;
        }
        
        .ticket-info-value {
          color: #000;
        }
        
        .qr-code-container {
          text-align: center;
          margin-top: 20px;
        }
        
        .qr-code {
          max-width: 200px;
          height: auto;
        }
        
        .ticket-footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ccc;
          font-size: 12px;
          color: #666;
        }
        
        @media print {
          .ticket-print-template {
            margin: 0;
            padding: 0;
          }
          
          .ticket-card {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          
          .ticket-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
        }
      `}</style>
      
      <div className="ticket-header">
        <h1>Event Tickets</h1>
        <p><strong>Order #{order.id}</strong></p>
        <p>Customer: {order.customer?.first_name} {order.customer?.last_name}</p>
        <p>Email: {order.email}</p>
        <p>Order Date: {formatDate(order.created_at)}</p>
      </div>
      
      <div className="ticket-grid">
        {qrCodesData.qrCodes.map((qr, index) => (
          <div key={qr.itemId} className="ticket-card">
            <div className="ticket-number">
              Ticket #{index + 1}
            </div>
            
            <div className="ticket-info">
              <div className="ticket-info-row">
                <span className="ticket-info-label">Event:</span>
                <span className="ticket-info-value">{qr.itemInfo.productTitle}</span>
              </div>
              
              <div className="ticket-info-row">
                <span className="ticket-info-label">Ticket Type:</span>
                <span className="ticket-info-value">{qr.itemInfo.variantTitle}</span>
              </div>
              
              <div className="ticket-info-row">
                <span className="ticket-info-label">Seat:</span>
                <span className="ticket-info-value">{qr.qrData.seatNumber}</span>
              </div>
              
              <div className="ticket-info-row">
                <span className="ticket-info-label">Show Date:</span>
                <span className="ticket-info-value">{formatShowDate(qr.qrData.showDate)}</span>
              </div>
              
              <div className="ticket-info-row">
                <span className="ticket-info-label">Venue:</span>
                <span className="ticket-info-value">{qr.qrData.venue}</span>
              </div>
              
              <div className="ticket-info-row">
                <span className="ticket-info-label">Order #:</span>
                <span className="ticket-info-value">{order.id}</span>
              </div>
              
              <div className="ticket-info-row">
                <span className="ticket-info-label">Customer:</span>
                <span className="ticket-info-value">{order.customer?.first_name} {order.customer?.last_name}</span>
              </div>
              
              <div className="ticket-info-row">
                <span className="ticket-info-label">Email:</span>
                <span className="ticket-info-value">{order.email}</span>
              </div>
            </div>
            
            <div className="qr-code-container">
              <img 
                src={qr.qrCode} 
                alt={`QR Code for Ticket ${index + 1}`}
                className="qr-code"
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="ticket-footer">
        <p>Please present this ticket at the venue entrance. Each QR code is unique and can only be used once.</p>
        <p>For support, contact: support@yourcompany.com</p>
      </div>
    </div>
  )
}

export default TicketPrintTemplate
