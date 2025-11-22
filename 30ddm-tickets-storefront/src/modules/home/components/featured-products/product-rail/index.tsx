import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import InteractiveLink from "@modules/common/components/interactive-link"
import EventCard from "@modules/products/components/event-card"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts || pricedProducts.length === 0) {
    return null
  }

  return (
    <div className="content-container py-12 small:py-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            {collection.title}
          </h2>
          {collection.metadata?.description && (
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {collection.metadata.description as string}
            </p>
          )}
        </div>
        <InteractiveLink 
          href={`/collections/${collection.handle}`}
          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
        >
          View all →
        </InteractiveLink>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pricedProducts.map((product) => (
          <EventCard 
            key={product.id} 
            product={product} 
            region={region}
            featured={collection.handle === "featured"}
          />
        ))}
      </div>
    </div>
  )
}
