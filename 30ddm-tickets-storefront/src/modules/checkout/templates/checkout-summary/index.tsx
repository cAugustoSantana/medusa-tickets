"use client"

import { Heading } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { calculateServiceFeeForCart } from "@lib/data/cart"
import { Spinner } from "@medusajs/icons"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  const [serviceFee, setServiceFee] = useState<number>(0)
  const [isLoadingServiceFee, setIsLoadingServiceFee] = useState(true) // Start with true to show loading

  useEffect(() => {
    const addServiceFee = async () => {
      console.log('Checkout Summary - Cart object:', cart)
      console.log('Checkout Summary - Cart ID:', cart?.id)
      
      if (!cart?.id) {
        console.log('Checkout Summary - No cart ID, skipping service fee calculation')
        return
      }
      
      try {
        console.log('Checkout: Calculating service fee for cart:', cart.id)
        const cartWithFee = await calculateServiceFeeForCart(cart.id)
        console.log('Checkout: Service fee calculated:', cartWithFee)
        
        // Extract just the service fee amount, keep original cart structure
        const serviceFeeAmount = (cartWithFee as any)?.service_fee || 0
        setServiceFee(serviceFeeAmount)
      } catch (error) {
        console.error('Error adding service fee:', error)
        setServiceFee(0)
      } finally {
        setIsLoadingServiceFee(false)
      }
    }

    addServiceFee()
  }, [cart?.id])

  // Create cart object with service fee for totals display
  const cartForTotals = cart ? {
    ...cart,
    service_fee: serviceFee,
    is_loading_service_fee: isLoadingServiceFee
  } : null

  console.log('Checkout Summary Debug:', {
    originalCart: cart,
    serviceFee,
    cartForTotals,
    isLoadingServiceFee
  })

  return (
    <div className="sticky top-0 flex flex-col-reverse small:flex-col gap-y-8 py-8 small:py-0 ">
      <div className="w-full bg-white flex flex-col">
        <Divider className="my-6 small:hidden" />
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular items-baseline"
        >
          In your Cart
        </Heading>
        <Divider className="my-6" />
        {isLoadingServiceFee ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <Spinner className="h-6 w-6" />
              <p className="text-sm text-gray-600">Adding service fee...</p>
            </div>
          </div>
        ) : (
          <CartTotals totals={cartForTotals} />
        )}
        <ItemsPreviewTemplate cart={cart} />
        <div className="my-6">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary
