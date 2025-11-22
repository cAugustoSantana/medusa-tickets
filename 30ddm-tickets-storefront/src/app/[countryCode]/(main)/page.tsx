import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import RecentEvents from "@modules/home/components/recent-events"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { Button } from "@/components/ui/button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Event Tickets - Discover Your Next Unforgettable Experience",
  description:
    "Find and book tickets to the best events, concerts, shows, and experiences. Browse our curated selection of upcoming events.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />

      {/* Featured Events */}
      <section className="py-16 px-4 md:px-8 bg-white dark:bg-slate-950">
        <div className="content-container">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Featured Events</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Hand-picked events happening now</p>
          </div>
          <ul className="flex flex-col gap-x-6">
            <FeaturedProducts collections={collections} region={region} />
          </ul>
        </div>
      </section>

      {/* Recent Events */}
      <RecentEvents region={region} />

      {/* Stats Section */}
      <section className="py-16 px-4 md:px-8 bg-slate-50 dark:bg-slate-900 border-t border-border">
        <div className="content-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400">50K+</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Events Listed</p>
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400">1M+</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Happy Customers</p>
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400">24/7</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Customer Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="content-container max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">Ready to Experience Live Entertainment?</h2>
          <p className="text-lg opacity-90">Join thousands of event-goers and discover amazing experiences</p>
          <LocalizedClientLink href="/store">
            <Button size="lg" variant="secondary" className="font-semibold">
              Start Browsing Events
            </Button>
          </LocalizedClientLink>
        </div>
      </section>
    </>
  )
}
