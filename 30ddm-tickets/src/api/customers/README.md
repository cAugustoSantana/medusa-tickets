# Customer Creation Endpoint

A public API endpoint for creating customers in Medusa without requiring authentication or publishable API keys.

## Endpoint

```
POST /customers
```

**Base URL:** `http://localhost:9000` (or your Medusa server URL)

## Authentication

**None required** - This is a public endpoint. No API keys, tokens, or authentication headers are needed.

## Request

### Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "email": "string (required)",
  "first_name": "string (required)",
  "last_name": "string (required)",
  "phone": "string (optional)",
  "metadata": "object (optional)"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email address |
| `first_name` | string | Yes | Customer's first name (min 1 character) |
| `last_name` | string | Yes | Customer's last name (min 1 character) |
| `phone` | string | No | Customer's phone number |
| `metadata` | object | No | Custom key-value pairs for additional data |

## Response

### Success Response (201 Created)

```json
{
  "customer": {
    "id": "cus_01HZ...",
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "metadata": {},
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "message": "Invalid email address",
  "error": "Validation error details"
}
```

**Common validation errors:**
- Missing required fields (`first_name`, `last_name`, `email`)
- Invalid email format
- Empty string values for required fields

#### 409 Conflict - Duplicate Email

```json
{
  "message": "A customer with this email already exists",
  "error": "Error details"
}
```

## Examples

### cURL

```bash
curl -X POST http://localhost:9000/customers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }'
```

### JavaScript/TypeScript (Fetch API)

```typescript
const createCustomer = async (customerData: {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}) => {
  const response = await fetch('http://localhost:9000/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create customer');
  }

  return response.json();
};

// Usage
const customer = await createCustomer({
  email: 'user@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890',
});
```

### Next.js (Server Component)

```typescript
// app/api/create-customer/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  const response = await fetch(`${process.env.MEDUSA_BACKEND_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return Response.json(
      { error: 'Failed to create customer' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return Response.json(data, { status: 201 });
}
```

### Next.js (Client Component)

```typescript
'use client';

const CustomerForm = () => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const customerData = {
      email: formData.get('email') as string,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      phone: formData.get('phone') as string,
    };

    try {
      const response = await fetch('http://localhost:9000/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        const { customer } = await response.json();
        console.log('Customer created:', customer);
      } else {
        const error = await response.json();
        console.error('Error:', error.message);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

## Validation Rules

1. **Email**: Must be a valid email format
2. **First Name**: Required, minimum 1 character
3. **Last Name**: Required, minimum 1 character
4. **Phone**: Optional, no format validation
5. **Metadata**: Optional object, can contain any key-value pairs

## Error Handling

The endpoint handles the following error scenarios:

- **Validation Errors**: Returns 400 with validation message
- **Duplicate Email**: Returns 409 Conflict when email already exists
- **Server Errors**: Returns 400 with error message

## CORS Configuration

Make sure your Medusa server's CORS settings allow requests from your Next.js application:

```env
# In your .env file
STORE_CORS=http://localhost:3000,https://your-nextjs-app.com
```

## Notes

- This endpoint is located at `/customers` (not `/store/customers`) to avoid the publishable API key requirement
- Customers created through this endpoint are not automatically authenticated
- If you need to authenticate the customer after creation, use Medusa's auth endpoints separately
- The endpoint uses Medusa's `createCustomers` method internally, which accepts an array and returns an array

## Related Endpoints

- **Admin Customer Creation**: `POST /admin/customers` (requires admin authentication)
- **Store Customer Registration**: `POST /store/customers` (requires publishable API key and auth token)
- **Customer Authentication**: `POST /auth/customer/emailpass/register` (for customer registration with password)

## Implementation Details

The endpoint is implemented in `src/api/customers/route.ts` and uses:
- **Zod** for request validation
- **Medusa Customer Module Service** (`Modules.CUSTOMER`) for customer creation
- **Middleware** for automatic validation (configured in `src/api/middlewares.ts`)

## Testing

You can test the endpoint using the provided test script or any HTTP client:

```bash
# Test with curl
curl -X POST http://localhost:9000/customers \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","first_name":"Test","last_name":"User"}'
```

## Support

For issues or questions:
1. Check Medusa documentation: https://docs.medusajs.com
2. Review the endpoint implementation in `src/api/customers/route.ts`
3. Check server logs for detailed error messages

