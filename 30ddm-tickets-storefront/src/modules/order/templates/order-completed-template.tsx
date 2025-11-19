import { Heading } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"
import BillingDetails from "@modules/order/components/billing-details"
import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import PaymentDetails from "@modules/order/components/payment-details"
import OrderQRCodes from "@modules/order/components/qr-codes"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  readonly order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  // Calculate service fee from order
  // First, try to find it as a line item with metadata.is_service_fee
  const serviceFeeItem = order.items?.find(
    (item) => item.metadata?.is_service_fee === true
  )
  
  let serviceFee = 0
  if (serviceFeeItem) {
    // Service fee exists as a line item
    serviceFee = (serviceFeeItem.unit_price || 0) * (serviceFeeItem.quantity || 1)
  } else if (order.item_subtotal) {
    // Calculate service fee as 10% of item_subtotal if not stored as line item
    serviceFee = Math.round((order.item_subtotal || 0) * 0.1)
  }

  // Prepare totals object with service fee for CartTotals
  // Map order items to the format expected by CartTotals
  const totalsWithServiceFee = {
    total: order.total,
    subtotal: order.subtotal,
    tax_total: order.tax_total,
    currency_code: order.currency_code,
    item_subtotal: order.item_subtotal,
    shipping_subtotal: order.shipping_total,
    discount_subtotal: order.discount_total,
    items: order.items?.map((item) => ({
      unit_price: item.unit_price,
      metadata: item.metadata
        ? {
            is_service_fee: item.metadata.is_service_fee as boolean | undefined,
          }
        : undefined,
    })),
    service_fee: serviceFee,
    is_loading_service_fee: false,
  }

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
          >
            <span>Thank you!</span>
            <span>Your order was placed successfully.</span>
          </Heading>
          <OrderDetails order={order} />
          <OrderQRCodes order={order} />
          <Heading level="h2" className="flex flex-row text-3xl-regular">
            Summary
          </Heading>
          <Items order={order} />
          <CartTotals totals={totalsWithServiceFee} />
          <BillingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
