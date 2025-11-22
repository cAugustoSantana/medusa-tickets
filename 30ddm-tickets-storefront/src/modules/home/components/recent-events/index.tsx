import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import EventCard from "@modules/products/components/event-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function RecentEvents({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      limit: 6,
      order: "-created_at", // Most recent first
      fields: "*variants.calculated_price",
    },
  })

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="py-16 px-4 md:px-8 bg-white dark:bg-slate-950">
      <div className="content-container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Recent Events</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Latest events added to our platform</p>
          </div>
          <LocalizedClientLink 
            href="/store"
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
          >
            View all →
          </LocalizedClientLink>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-6">
          {products.slice(0, 6).map((product) => (
            <EventCard 
              key={product.id} 
              product={product} 
              region={region}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

