# Environment Configuration for Dynamic URLs

This document explains how to configure environment variables to ensure QR codes and validation URLs work correctly in all deployment environments.

## Environment Variables

### Backend (30ddm-tickets)

Set these environment variables in your backend deployment:

```bash
# Primary storefront URL (recommended)
STORE_URL=https://your-domain.com

# Alternative: Backend URL (will be converted to frontend URL)
MEDUSA_BACKEND_URL=https://api.your-domain.com

# Alternative: Public backend URL
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.your-domain.com
```

### Frontend (30ddm-tickets-storefront)

Set these environment variables in your frontend deployment:

```bash
# Primary storefront URL (recommended)
NEXT_PUBLIC_STORE_URL=https://your-domain.com

# Alternative: Backend URL (will be converted to frontend URL)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.your-domain.com
```

## URL Resolution Logic

The system uses the following priority order to determine the base URL:

1. **STORE_URL** / **NEXT_PUBLIC_STORE_URL** - Explicitly set storefront URL
2. **MEDUSA_BACKEND_URL** / **NEXT_PUBLIC_MEDUSA_BACKEND_URL** - Backend URL (converted to frontend)
3. **Default fallback** - `http://localhost:8000` for development

## Examples

### Development
```bash
# Backend
MEDUSA_BACKEND_URL=http://localhost:9000

# Frontend  
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
```

### Production
```bash
# Backend
STORE_URL=https://tickets.yourcompany.com

# Frontend
NEXT_PUBLIC_STORE_URL=https://tickets.yourcompany.com
```

### Separate API/Frontend Domains
```bash
# Backend
MEDUSA_BACKEND_URL=https://api.yourcompany.com

# Frontend
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourcompany.com
```

## QR Code URLs

QR codes will automatically generate validation URLs in the format:
```
{STORE_URL}/{countryCode}/tickets/validate/{ticketId}
```

For example:
- Development: `http://localhost:8000/dk/tickets/validate/01K8C93V0H3HZB4GXECS86ZYYE`
- Production: `https://tickets.yourcompany.com/dk/tickets/validate/01K8C93V0H3HZB4GXECS86ZYYE`

## Testing

To test URL generation in different environments:

1. **Development**: URLs will use `http://localhost:8000`
2. **Staging**: Set `STORE_URL=https://staging.yourcompany.com`
3. **Production**: Set `STORE_URL=https://tickets.yourcompany.com`

The QR codes and email validation URLs will automatically adapt to your environment configuration.
