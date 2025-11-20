# Service Fee Documentation

## Overview

This application implements an automatic 10% service fee on all ticket products. The service fee is calculated as a percentage of the ticket price and is automatically added to the cart when items are added. The fee appears in the cart totals but is hidden from the items list to maintain a clean user experience.

## How It Works

### Architecture

The service fee implementation uses Medusa v2's workflow hooks system to automatically add and update a service fee line item whenever the cart is refreshed. This ensures the fee is always accurate and up-to-date.

### Components

1. **Configuration File** (`src/config/service-fee.ts`)
   - Defines the service fee percentage (default: 10%)
   - Easy to modify in one place

2. **Workflow Hook** (`src/workflows/hooks/add-service-fee.ts`)
   - Hooks into `refreshCartItemsWorkflow.beforeRefreshingPaymentCollection`
   - Automatically calculates and adds/updates the service fee line item
   - Runs whenever the cart is refreshed (after adding, updating, or removing items)

3. **Frontend Display** (`30ddm-tickets-storefront/src/modules/common/components/cart-totals/index.tsx`)
   - Extracts and displays the service fee in the totals section
   - Service fee is hidden from items list but shown in totals

## Configuration

### Changing the Service Fee Percentage

To change the service fee percentage, edit `src/config/service-fee.ts`:

```typescript
export const SERVICE_FEE_PERCENTAGE = 0.1 // 10%
```

Change to your desired percentage:
- `0.1` = 10%
- `0.15` = 15%
- `0.05` = 5%

**Note:** The percentage is stored as a decimal (0.1 = 10%), not as a whole number.

### Making It Environment-Variable Configurable (Optional)

If you want to make the service fee configurable via environment variable, you can modify `src/config/service-fee.ts`:

```typescript
export const SERVICE_FEE_PERCENTAGE = parseFloat(
  process.env.SERVICE_FEE_PERCENTAGE || "0.1"
)
```

Then add to your `.env` file:
```
SERVICE_FEE_PERCENTAGE=0.1
```

## How the Service Fee is Calculated

1. **When items are added to cart:**
   - The `refreshCartItemsWorkflow` runs automatically
   - The hook `beforeRefreshingPaymentCollection` is triggered
   - The hook fetches all cart items (excluding existing service fee items)
   - For each ticket item: `serviceFee = item.unit_price × item.quantity × SERVICE_FEE_PERCENTAGE`
   - All service fees are summed to get the total service fee
   - A single "Service Fee" line item is added or updated with the total

2. **Example Calculation:**
   - 2 tickets at $100 each = $200 subtotal
   - Service fee: $200 × 0.1 = $20
   - **Total: $220**

## Service Fee Line Item Properties

The service fee line item is created with the following properties:

- **Title:** "Service Fee"
- **Product Title:** "Service Fee"
- **Unit Price:** Calculated total service fee amount
- **Quantity:** 1
- **Requires Shipping:** `false` (service fees don't need shipping)
- **Metadata:**
  - `type: "service_fee"`
  - `fee_percentage: 10` (the percentage as a whole number)

## Where the Service Fee Appears

### ✅ Visible In:
- **Cart Totals Section** - Shows as a separate line item between subtotal and shipping
- **Checkout Summary** - Appears in the totals breakdown
- **Order Summary** - Shown in the order confirmation page totals
- **Order Total** - Included in the final order total

### ❌ Hidden From:
- **Cart Items List** - Filtered out to avoid showing as a product
- **Checkout Items Preview** - Not shown in the items list
- **Cart Dropdown** - Excluded from the mini cart
- **Order Items List** - Not displayed as a product in order confirmation

## Technical Details

### Workflow Hook Implementation

The service fee hook runs at the `beforeRefreshingPaymentCollection` stage of the `refreshCartItemsWorkflow`. This ensures:

1. The service fee is calculated after all items are added/updated
2. The fee is recalculated whenever the cart changes
3. The fee is added before payment collection is refreshed
4. The cart totals are accurate including the service fee

### Service Fee Lifecycle

1. **Item Added to Cart:**
   ```
   User adds ticket → addToCartWorkflow runs → refreshCartItemsWorkflow runs 
   → Service fee hook calculates fee → Service fee line item added
   ```

2. **Item Removed from Cart:**
   ```
   User removes ticket → refreshCartItemsWorkflow runs → Service fee hook 
   recalculates → Service fee line item updated or removed if no tickets remain
   ```

3. **Cart Completed:**
   ```
   User completes order → completeCartWorkflow runs → Service fee included 
   in order total → Order created with service fee
   ```

### Filtering Service Fee Items

The frontend filters out service fee items from display using:

```typescript
items.filter((item) => item.metadata?.type !== "service_fee")
```

This is applied in:
- Cart items template
- Cart preview template (checkout)
- Cart dropdown
- Order items list

## Shipping Requirements

The service fee line item is marked with `requires_shipping: false` to prevent shipping validation errors. This ensures:

- The service fee doesn't trigger "No shipping method selected" errors
- Only actual ticket products require shipping
- The cart can be completed without shipping if only tickets are present

## Validation

The service fee items are excluded from cart validation in `complete-cart-validation.ts` because:

- They don't have a `variant_id` (they're custom line items)
- They don't need seat/date validation
- They're automatically managed by the system

## Troubleshooting

### Service Fee Not Appearing

1. **Check Backend Logs:**
   Look for `[Service Fee Hook]` messages in the console to see if the hook is running

2. **Verify Hook is Loaded:**
   Ensure the backend has been restarted after creating the hook file

3. **Check Cart Items:**
   Verify that ticket items are in the cart (service fee only applies to tickets)

4. **Check Totals Component:**
   Ensure the `CartTotals` component has access to `cart.items` to extract the service fee

### Service Fee Calculation Incorrect

1. **Check Configuration:**
   Verify `SERVICE_FEE_PERCENTAGE` in `src/config/service-fee.ts`

2. **Check Item Prices:**
   Ensure ticket items have valid `unit_price` values

3. **Check Console Logs:**
   The hook logs the calculated fee - check if it matches expectations

### Shipping Error with Service Fee

If you see "No shipping method selected" errors:

1. **Verify `requires_shipping: false`:**
   Check that the service fee line item is created with `requires_shipping: false`

2. **Check Hook Updates:**
   Ensure updates to existing service fee items also set `requires_shipping: false`

## Files Modified/Created

### Backend Files:
- `src/config/service-fee.ts` - Service fee configuration
- `src/workflows/hooks/add-service-fee.ts` - Service fee hook implementation
- `src/workflows/hooks/complete-cart-validation.ts` - Excludes service fee from validation

### Frontend Files:
- `30ddm-tickets-storefront/src/modules/common/components/cart-totals/index.tsx` - Displays service fee in totals
- `30ddm-tickets-storefront/src/modules/cart/templates/items.tsx` - Filters out service fee from items list
- `30ddm-tickets-storefront/src/modules/cart/templates/preview.tsx` - Filters out service fee from checkout preview
- `30ddm-tickets-storefront/src/modules/layout/components/cart-dropdown/index.tsx` - Filters out service fee from dropdown
- `30ddm-tickets-storefront/src/modules/order/components/items/index.tsx` - Filters out service fee from order items
- `30ddm-tickets-storefront/src/modules/order/components/order-summary/index.tsx` - Displays service fee in order summary

## Testing

To test the service fee implementation:

1. **Add Tickets to Cart:**
   - Add 2 tickets at $100 each
   - Verify service fee of $20 appears in totals
   - Verify total is $220

2. **Check Items List:**
   - Verify service fee does NOT appear in cart items list
   - Verify only tickets are shown

3. **Modify Cart:**
   - Add another ticket - service fee should update to $30 (10% of $300)
   - Remove a ticket - service fee should update accordingly

4. **Complete Order:**
   - Verify service fee appears in order summary totals
   - Verify service fee does NOT appear in order items list
   - Verify order total includes service fee

## Future Enhancements

Potential improvements:

1. **Per-Product Service Fee:**
   - Different service fees for different ticket types
   - Store fee percentage in product metadata

2. **Tiered Service Fees:**
   - Different percentages based on order total
   - Example: 10% for orders under $500, 8% for orders over $500

3. **Service Fee Exemptions:**
   - Exclude certain products from service fee
   - Store exemption flag in product metadata

4. **Service Fee Caps:**
   - Maximum service fee amount
   - Example: 10% up to $50 maximum

