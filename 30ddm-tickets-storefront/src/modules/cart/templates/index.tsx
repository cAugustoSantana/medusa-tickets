"use client"

import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useState } from "react"
import { calculateServiceFeeForCart } from "@lib/data/cart"
import { Spinner } from "@medusajs/icons"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const [serviceFee, setServiceFee] = useState<number>(0)
  const [isLoadingServiceFee, setIsLoadingServiceFee] = useState(false)

  useEffect(() => {
    const addServiceFee = async () => {
      console.log('Cart Template - Cart object:', cart)
      console.log('Cart Template - Cart ID:', cart?.id)
      
      if (!cart?.id) {
        console.log('Cart Template - No cart ID, skipping service fee calculation')
        return
      }
      
      try {
        setIsLoadingServiceFee(true)
        console.log('Calculating service fee for cart:', cart.id)
        const cartWithFee = await calculateServiceFeeForCart(cart.id)
        console.log('Service fee calculated:', cartWithFee)
        
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
    service_fee: serviceFee
  } : null

  console.log('Cart Template Debug:', {
    originalCart: cart,
    serviceFee,
    cartForTotals,
    isLoadingServiceFee
  })

  return (
    <div className="py-12">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
            <div className="flex flex-col bg-white py-6 gap-y-6">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-12">
                {cart && cart.region && (
                  <>
                    <div className="bg-white py-6">
                      {isLoadingServiceFee ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Spinner className="h-6 w-6" />
                            <p className="text-sm text-gray-600">Adding service fee...</p>
                          </div>
                        </div>
                      ) : (
                        <Summary cart={cartForTotals as any} />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
