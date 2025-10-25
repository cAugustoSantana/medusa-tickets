"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
    items?: Array<{
      unit_price: number
      metadata?: {
        is_service_fee?: boolean
      }
    }>
    service_fee?: number
    is_loading_service_fee?: boolean
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  // Get service fee and loading state from cart object
  const serviceFee = totals.service_fee || 0
  const isLoadingServiceFee = totals.is_loading_service_fee || false
  
  // Debug logging
  console.log('CartTotals Debug:', {
    serviceFee,
    isLoadingServiceFee,
    total,
    item_subtotal,
    currency_code,
    totals: totals,
    'isLoadingServiceFee type': typeof isLoadingServiceFee,
    'isLoadingServiceFee value': isLoadingServiceFee
  })
  
  // Calculate total including service fee
  const finalTotal = (total || 0) + serviceFee

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Subtotal (excl. shipping and taxes)</span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {convertToLocale({ amount: shipping_subtotal ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Service Fee (10%)</span>
          <span data-testid="cart-service-fee" data-value={serviceFee}>
            {isLoadingServiceFee ? (
              <span className="text-gray-500">
                <span className="inline-block animate-pulse">⏳</span> Calculating...
              </span>
            ) : (
              convertToLocale({ amount: serviceFee, currency_code })
            )}
          </span>
        </div>
        {!!discount_subtotal && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discount_subtotal ?? 0,
                currency_code,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">Taxes</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={finalTotal}
        >
          {convertToLocale({ amount: finalTotal, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
