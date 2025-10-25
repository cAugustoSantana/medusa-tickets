# Stripe Payment Integration Guide for Medusa v2

This guide will walk you through installing and configuring Stripe payment integration in your Medusa v2 ecommerce application.

## Prerequisites

- Medusa v2 application running
- Node.js 20+ installed
- Stripe account (test or live)
- PostgreSQL database configured

## Step 1: Install Stripe Payment Module

Navigate to your Medusa backend directory and install the Stripe payment module:

```bash
cd nrgcommerce
npm install @medusajs/payment-stripe
```

## Step 2: Configure Medusa Backend

Update your `medusa-config.ts` file to include the Stripe payment module:

```typescript
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              capture: false, // Set to true for automatic capture
              automatic_payment_methods: false,
              payment_description: "Payment for your order"
            },
          },
        ],
      },
    },
  ],
})
```

## Step 3: Configure Environment Variables

Create or update your `.env` file in the Medusa backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/medusa

# CORS Settings
STORE_CORS=http://localhost:8000,http://localhost:3000
ADMIN_CORS=http://localhost:7001,http://localhost:7000
AUTH_CORS=http://localhost:7001,http://localhost:7000

# JWT and Cookie Secrets
JWT_SECRET=your_jwt_secret_here_change_this_in_production
COOKIE_SECRET=your_cookie_secret_here_change_this_in_production

# Stripe Configuration
# Get your API keys from: https://dashboard.stripe.com/apikeys
STRIPE_API_KEY=sk_test_your_stripe_secret_key_here
# Get your webhook secret from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Step 4: Get Stripe API Keys

### 4.1 Get Stripe Secret Key
1. Go to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** (starts with `sk_test_` for test mode)
3. Update `STRIPE_API_KEY` in your `.env` file

### 4.2 Get Stripe Publishable Key
1. From the same API Keys page
2. Copy your **Publishable key** (starts with `pk_test_` for test mode)
3. You'll need this for the storefront configuration

## Step 5: Configure Storefront Environment

Create a `.env.local` file in your storefront directory (`nrgcommerce-storefront`):

```env
# Medusa Backend Configuration
MEDUSA_BACKEND_URL=http://localhost:9000

# Medusa Publishable Key (get from Medusa Admin)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_01HZ_your_medusa_publishable_key_here

# Stripe Configuration
NEXT_PUBLIC_STRIPE_KEY=pk_test_your_stripe_publishable_key_here
```

## Step 6: Get Medusa Publishable Key

1. Start your Medusa backend:
   ```bash
   cd nrgcommerce
   npm run dev
   ```

2. Go to Medusa Admin: `http://localhost:7001`
3. Navigate to **Settings** → **API Key Management**
4. Create a new API key or copy an existing one
5. Update `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` in your storefront `.env.local`

## Step 7: Set Up Stripe Webhooks (for Production)

### 7.1 Install ngrok (for local testing)
```bash
npm install -g ngrok
```

### 7.2 Start ngrok
```bash
ngrok http 9000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 7.3 Configure Stripe Webhook
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. **Endpoint URL**: `https://your-ngrok-url.ngrok.io/hooks/payment/stripe_stripe`
4. **Events to select**:
   - `payment_intent.amount_capturable_updated`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.partially_funded`
5. Copy the **Signing secret** and update `STRIPE_WEBHOOK_SECRET` in your `.env`

## Step 8: Enable Stripe in Medusa Admin

1. Go to Medusa Admin: `http://localhost:7001`
2. Navigate to **Settings** → **Regions**
3. Edit a region
4. In the **Payment Providers** section, enable:
   - ✅ **Stripe** (Basic Stripe Payment)
   - ✅ **Stripe Bancontact** (optional)
   - ✅ **Stripe iDEAL** (optional)
   - ✅ **Stripe giropay** (optional)
   - ✅ **Stripe BLIK** (optional)
   - ✅ **Stripe Przelewy24** (optional)
   - ✅ **Stripe PromptPay** (optional)
5. Save changes

## Step 9: Start Your Applications

### 9.1 Start Medusa Backend
```bash
cd nrgcommerce
npm run dev
```

### 9.2 Start Storefront
```bash
cd nrgcommerce-storefront
npm run dev
```

## Step 10: Test the Integration

1. Go to your storefront (usually `http://localhost:3000`)
2. Create a test product in Medusa Admin
3. Add product to cart
4. Proceed to checkout
5. You should see Stripe payment options

### Test Card Numbers
Use these test card numbers for testing:
- **Successful payment**: `4242 4242 4242 4242`
- **Declined payment**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

## Available Stripe Payment Methods

Once configured, you'll have access to these payment providers:

| Payment Method | Provider ID | Description |
|----------------|-------------|-------------|
| **Basic Stripe** | `pp_stripe_stripe` | Credit/Debit cards, Apple Pay, Google Pay |
| **Bancontact** | `pp_stripe-bancontact_stripe` | Belgian payment method |
| **BLIK** | `pp_stripe-blik_stripe` | Polish mobile payment |
| **giropay** | `pp_stripe-giropay_stripe` | German online banking |
| **iDEAL** | `pp_stripe-ideal_stripe` | Dutch online banking |
| **Przelewy24** | `pp_stripe-przelewy24_stripe` | Polish online banking |
| **PromptPay** | `pp_stripe-promptpay_stripe` | Thai QR payment |

## Troubleshooting

### Common Issues

1. **"Payment component never finishes loading"**
   - Check that all environment variables are set correctly
   - Ensure Medusa backend is running on port 9000
   - Verify Stripe keys are correct

2. **"ECONNREFUSED" error**
   - Check database connection
   - Ensure all environment variables are properly formatted (no quotes around values)
   - Restart the Medusa server

3. **"Stripe key is missing" error**
   - Ensure `NEXT_PUBLIC_STRIPE_KEY` is set in storefront `.env.local`
   - Verify the key starts with `pk_test_` or `pk_live_`

4. **Webhook not receiving events**
   - Check ngrok is running and URL is correct
   - Verify webhook endpoint URL format: `/hooks/payment/stripe_stripe`
   - Ensure webhook secret is correct

### Environment Variables Checklist

**Backend (nrgcommerce/.env):**
- ✅ `DATABASE_URL`
- ✅ `STRIPE_API_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `STORE_CORS`
- ✅ `ADMIN_CORS`
- ✅ `AUTH_CORS`

**Storefront (nrgcommerce-storefront/.env.local):**
- ✅ `MEDUSA_BACKEND_URL`
- ✅ `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- ✅ `NEXT_PUBLIC_STRIPE_KEY`

## Next Steps

1. **Customize Payment UI**: Modify the checkout components to match your design
2. **Add Saved Payment Methods**: Implement customer payment method storage
3. **Configure Different Payment Methods**: Enable specific payment methods per region
4. **Set Up Production**: Configure live Stripe keys and production webhooks

## Resources

- [Medusa Stripe Documentation](https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider/stripe)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Medusa Storefront Stripe Guide](https://docs.medusajs.com/resources/storefront-development/checkout/payment/stripe)

---

**Note**: This guide assumes you're using the default Medusa v2 setup. Adjust paths and configurations based on your specific setup.