# QR Code Generation for Orders

## Overview
This system automatically generates QR codes when orders are placed, containing all relevant order item information for validation, returns, and order verification.

## How It Works

### 1. Automatic QR Code Generation & Email Delivery
When a customer places an order, the `order-placed` subscriber automatically:
- Fetches the order details with order items
- Generates a unique QR code for each order item
- Sends an order confirmation email with QR codes included
- Logs the QR code generation and email delivery

### 2. QR Code Data Structure
Each QR code contains JSON data with:
```json
{
  "orderId": "order_123",
  "itemId": "item_456", 
  "productId": "product_789",
  "productTitle": "Product Name",
  "variantTitle": "Size: Large, Color: Blue",
  "quantity": 2,
  "unitPrice": 2500,
  "total": 5000,
  "customerEmail": "customer@example.com",
  "orderDate": "2025-01-15T19:00:00Z"
}
```

## API Endpoints

### Get QR Codes for an Order
**GET** `/store/orders/{orderId}/qr-codes`

Returns all QR codes for a specific order:
```json
{
  "orderId": "order_123",
  "orderDisplayId": "order_123", 
  "customerEmail": "customer@example.com",
  "qrCodes": [
    {
      "itemId": "item_456",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "qrData": { /* QR code data object */ },
      "itemInfo": {
        "productTitle": "Product Name",
        "variantTitle": "Size: Large, Color: Blue",
        "quantity": 2,
        "unitPrice": 2500,
        "total": 5000
      }
    }
  ],
  "totalItems": 1
}
```

### Validate QR Code
**POST** `/store/qr-codes/validate`

Body:
```json
{
  "qrData": "{\"orderId\":\"order_123\",\"itemId\":\"item_456\",...}"
}
```

Response:
```json
{
  "valid": true,
  "itemInfo": {
    "itemId": "item_456",
    "orderId": "order_123",
    "orderDisplayId": "order_123",
    "customerEmail": "customer@example.com", 
    "productTitle": "Product Name",
    "variantTitle": "Size: Large, Color: Blue",
    "quantity": 2,
    "unitPrice": 2500,
    "total": 5000,
    "orderDate": "2025-01-15T19:00:00Z"
  },
  "scannedAt": "2025-01-15T18:30:00Z",
  "message": "Order item is valid"
}
```

## Usage Examples

### 1. Generate QR Codes & Send Email (Automatic)
QR codes are automatically generated and sent via email when orders are placed. Check server logs for:
```
Order order_123 - Generated 2 QR codes
Generated QR code for order item: item_456
Order confirmation email sent to customer@example.com with 2 QR codes
```

### 2. Retrieve QR Codes via API (Backup Method)
```bash
curl -X GET "http://localhost:9000/store/orders/order_123/qr-codes"
```

### 3. Validate a Scanned QR Code
```bash
curl -X POST "http://localhost:9000/store/qr-codes/validate" \
  -H "Content-Type: application/json" \
  -d '{"qrData": "{\"orderId\":\"order_123\",\"itemId\":\"item_456\"}"}'
```

## Email Integration

### Automatic Email Delivery
When orders are placed, customers automatically receive:
- **Order confirmation email** with QR codes embedded
- **Individual QR code images** for each order item
- **Item details** including product name, variant, quantity, and pricing
- **Instructions** on how to use the QR codes for returns and exchanges

### Email Template Features
- Beautiful, responsive email design
- QR code images embedded directly in the email
- Order item information clearly displayed
- Professional styling with Tailwind CSS

## Integration with Frontend

### Display QR Codes to Customers
1. **Primary**: QR codes are automatically sent via email
2. **Order Confirmation Page**: QR codes are displayed on the order confirmation screen
3. **API Access**: After order completion, call the QR codes API to retrieve QR codes
4. **Print/Download**: Customers can print QR codes directly from the order confirmation page

### Order Item Validation
1. Staff can scan QR codes for returns/exchanges
2. Use the validation API to verify order items
3. Display order item information for processing returns

## Extensions

### Save QR Codes to Database
You can extend the system to:
- Save QR codes to the database for persistence
- Generate QR codes on-demand rather than at order time
- Add QR code expiration or usage tracking

### Email Integration
- Include QR code images in order confirmation emails
- Send QR codes as attachments
- Generate printable order PDFs with QR codes

### Security Enhancements
- Add encryption to QR code data
- Implement QR code expiration
- Add anti-fraud measures

## Testing
To test the QR code functionality:
1. Place a test order through your storefront
2. Check server logs for QR code generation messages
3. Verify QR codes are displayed on the order confirmation page
4. Use the API endpoints to retrieve and validate QR codes
5. Test QR code scanning with a mobile device
6. Verify email delivery with QR codes embedded
7. Test the print functionality on the order confirmation page
