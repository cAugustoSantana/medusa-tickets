import { Suspense } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import { Button } from "@/components/ui/button"

export default async function Nav() {
  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white dark:bg-slate-950 border-border backdrop-blur-sm bg-background/95">
        <nav className="content-container flex items-center justify-between w-full h-full">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <LocalizedClientLink
              href="/"
              className="font-bold text-xl text-slate-900 dark:text-white hover:opacity-80 transition"
              data-testid="nav-store-link"
            >
              EventPass
            </LocalizedClientLink>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <LocalizedClientLink
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              href="/store"
              data-testid="nav-browse-link"
            >
              Browse Events
            </LocalizedClientLink>
            <LocalizedClientLink
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              href="/account"
              data-testid="nav-account-link"
            >
              My Tickets
            </LocalizedClientLink>
            <LocalizedClientLink
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              href="/account"
            >
              For Organizers
            </LocalizedClientLink>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <LocalizedClientLink href="/account">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                Sign In
              </Button>
            </LocalizedClientLink>
            <LocalizedClientLink href="/account">
              <Button size="sm" className="hidden sm:flex bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                Get Started
              </Button>
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
