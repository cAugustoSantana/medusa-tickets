import jsPDF from 'jspdf'
import QRCode from 'qrcode'
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

export const generateIndividualTicketPDF = async (
  order: HttpTypes.StoreOrder,
  qrCode: QRCodeData,
  ticketNumber: number
): Promise<void> => {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Set up fonts and colors
  doc.setFont('helvetica')
  
  // Header
  doc.setFontSize(24)
  doc.setTextColor(0, 0, 0)
  doc.text('EVENT TICKET', pageWidth / 2, 30, { align: 'center' })
  
  // Order info
  doc.setFontSize(12)
  doc.text(`Order #: ${order.id}`, 20, 50)
  doc.text(`Ticket #: ${ticketNumber}`, pageWidth - 20, 50, { align: 'right' })
  
  // Customer info
  doc.text(`Customer: ${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`, 20, 65)
  doc.text(`Email: ${order.email}`, 20, 75)
  
  // Ticket details
  doc.setFontSize(16)
  doc.text('TICKET DETAILS', 20, 95)
  
  doc.setFontSize(12)
  const details = [
    { label: 'Event:', value: qrCode.itemInfo.productTitle },
    { label: 'Ticket Type:', value: qrCode.itemInfo.variantTitle },
    { label: 'Seat:', value: qrCode.qrData.seatNumber },
    { label: 'Show Date:', value: formatShowDate(qrCode.qrData.showDate) },
    { label: 'Venue:', value: qrCode.qrData.venue },
  ]
  
  let yPos = 110
  details.forEach(({ label, value }) => {
    doc.text(`${label} ${value}`, 20, yPos)
    yPos += 10
  })
  
  // QR Code
  try {
    // Generate QR code data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrCode.qrData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    // Convert data URL to image
    const qrCodeImg = new Image()
    qrCodeImg.src = qrCodeDataURL
    
    await new Promise((resolve, reject) => {
      qrCodeImg.onload = resolve
      qrCodeImg.onerror = reject
    })
    
    // Add QR code to PDF
    const qrSize = 60
    const qrX = pageWidth - qrSize - 20
    const qrY = 120
    
    doc.addImage(qrCodeImg, 'PNG', qrX, qrY, qrSize, qrSize)
    
    // QR code label
    doc.setFontSize(10)
    doc.text('SCAN FOR VALIDATION', qrX + qrSize / 2, qrY + qrSize + 10, { align: 'center' })
  } catch (error) {
    console.error('Error adding QR code to PDF:', error)
    doc.text('QR Code could not be loaded', pageWidth - 20, 150, { align: 'right' })
  }
  
  // Footer
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Please present this ticket at the venue entrance.', 20, pageHeight - 30)
  doc.text('Each QR code is unique and can only be used once.', 20, pageHeight - 20)
  doc.text('For support: support@yourcompany.com', 20, pageHeight - 10)
  
  // Save the PDF
  const fileName = `ticket-${order.id}-${ticketNumber}.pdf`
  doc.save(fileName)
}

export const generateCombinedTicketsPDF = async (
  order: HttpTypes.StoreOrder,
  qrCodesData: OrderQRCodesResponse
): Promise<void> => {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Set up fonts
  doc.setFont('helvetica')
  
  // Header for all tickets
  doc.setFontSize(24)
  doc.setTextColor(0, 0, 0)
  doc.text('EVENT TICKETS', pageWidth / 2, 30, { align: 'center' })
  
  doc.setFontSize(12)
  doc.text(`Order #: ${order.id}`, 20, 45)
  doc.text(`Customer: ${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`, 20, 55)
  doc.text(`Email: ${order.email}`, 20, 65)
  doc.text(`Total Tickets: ${qrCodesData.totalItems}`, 20, 75)
  
  // Add a line separator
  doc.line(20, 85, pageWidth - 20, 85)
  
  let currentY = 100
  
  for (let i = 0; i < qrCodesData.qrCodes.length; i++) {
    const qrCode = qrCodesData.qrCodes[i]
    
    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      doc.addPage()
      currentY = 20
    }
    
    // Ticket header
    doc.setFontSize(16)
    doc.text(`TICKET #${i + 1}`, 20, currentY)
    currentY += 15
    
    // Ticket details
    doc.setFontSize(12)
    const details = [
      { label: 'Event:', value: qrCode.itemInfo.productTitle },
      { label: 'Ticket Type:', value: qrCode.itemInfo.variantTitle },
      { label: 'Seat:', value: qrCode.qrData.seatNumber },
      { label: 'Show Date:', value: formatShowDate(qrCode.qrData.showDate) },
      { label: 'Venue:', value: qrCode.qrData.venue },
    ]
    
    details.forEach(({ label, value }) => {
      doc.text(`${label} ${value}`, 20, currentY)
      currentY += 8
    })
    
    // QR Code
    try {
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrCode.qrData), {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      const qrCodeImg = new Image()
      qrCodeImg.src = qrCodeDataURL
      
      await new Promise((resolve, reject) => {
        qrCodeImg.onload = resolve
        qrCodeImg.onerror = reject
      })
      
      const qrSize = 40
      const qrX = pageWidth - qrSize - 20
      const qrY = currentY - 35
      
      doc.addImage(qrCodeImg, 'PNG', qrX, qrY, qrSize, qrSize)
      
      doc.setFontSize(8)
      doc.text('SCAN FOR VALIDATION', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' })
    } catch (error) {
      console.error('Error adding QR code to PDF:', error)
      doc.text('QR Code could not be loaded', pageWidth - 20, currentY - 10, { align: 'right' })
    }
    
    currentY += 20
    
    // Add separator line between tickets (except for the last one)
    if (i < qrCodesData.qrCodes.length - 1) {
      doc.line(20, currentY, pageWidth - 20, currentY)
      currentY += 10
    }
  }
  
  // Footer
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Please present these tickets at the venue entrance.', 20, pageHeight - 30)
  doc.text('Each QR code is unique and can only be used once.', 20, pageHeight - 20)
  doc.text('For support: support@yourcompany.com', 20, pageHeight - 10)
  
  // Save the PDF
  const fileName = `tickets-${order.id}-all.pdf`
  doc.save(fileName)
}

const formatShowDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
