import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import EventCard from "@modules/products/components/event-card"
import BrowseClient from "./browse-client"

export default async function BrowsePage(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string; location?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams

  const { countryCode } = params
  const region = await getRegion(countryCode)

  if (!region) {
    return (
      <div className="min-h-screen bg-background">
        <div className="content-container py-16 text-center">
          <p className="text-muted-foreground">Region not found</p>
        </div>
      </div>
    )
  }

  const { response } = await listProducts({
    regionId: region.id,
    queryParams: {
      fields: "*variants.calculated_price",
    },
  })

  const products = response.products || []

  return (
    <BrowseClient
      products={products}
      region={region}
      initialQuery={searchParams.q || ""}
      initialLocation={searchParams.location || ""}
    />
  )
}
