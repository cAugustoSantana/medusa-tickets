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

export const printTickets = async (order: HttpTypes.StoreOrder, qrCodesData: OrderQRCodesResponse) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  
  if (!printWindow) {
    console.error('Could not open print window')
    return
  }

  // Generate the HTML content for the print template
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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Event Tickets - Order ${order.id}</title>
      <style>
        body {
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
          body {
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
      </style>
    </head>
    <body>
      <div class="ticket-header">
        <h1>Event Tickets</h1>
        <p><strong>Order #${order.id}</strong></p>
        <p>Customer: ${order.customer?.first_name || ''} ${order.customer?.last_name || ''}</p>
        <p>Email: ${order.email}</p>
        <p>Order Date: ${formatDate(order.created_at)}</p>
      </div>
      
      <div class="ticket-grid">
        ${qrCodesData.qrCodes.map((qr, index) => `
          <div class="ticket-card">
            <div class="ticket-number">
              Ticket #${index + 1}
            </div>
            
            <div class="ticket-info">
              <div class="ticket-info-row">
                <span class="ticket-info-label">Event:</span>
                <span class="ticket-info-value">${qr.itemInfo.productTitle}</span>
              </div>
              
              <div class="ticket-info-row">
                <span class="ticket-info-label">Ticket Type:</span>
                <span class="ticket-info-value">${qr.itemInfo.variantTitle}</span>
              </div>
              
              <div class="ticket-info-row">
                <span class="ticket-info-label">Seat:</span>
                <span class="ticket-info-value">${qr.qrData.seatNumber}</span>
              </div>
              
              <div class="ticket-info-row">
                <span class="ticket-info-label">Show Date:</span>
                <span class="ticket-info-value">${formatShowDate(qr.qrData.showDate)}</span>
              </div>
              
              <div class="ticket-info-row">
                <span class="ticket-info-label">Venue:</span>
                <span class="ticket-info-value">${qr.qrData.venue}</span>
              </div>
              
              <div class="ticket-info-row">
                <span class="ticket-info-label">Order #:</span>
                <span class="ticket-info-value">${order.id}</span>
              </div>
              
              <div class="ticket-info-row">
                <span class="ticket-info-label">Customer:</span>
                <span class="ticket-info-value">${order.customer?.first_name || ''} ${order.customer?.last_name || ''}</span>
              </div>
              
              <div class="ticket-info-row">
                <span class="ticket-info-label">Email:</span>
                <span class="ticket-info-value">${order.email}</span>
              </div>
            </div>
            
            <div class="qr-code-container">
              <img 
                src="${qr.qrCode}" 
                alt="QR Code for Ticket ${index + 1}"
                class="qr-code"
              />
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="ticket-footer">
        <p>Please present this ticket at the venue entrance. Each QR code is unique and can only be used once.</p>
        <p>For support, contact: support@yourcompany.com</p>
      </div>
    </body>
    </html>
  `

  // Write the content to the new window
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Wait for images to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }
}
