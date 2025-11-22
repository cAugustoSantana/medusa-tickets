import { HttpTypes } from "@medusajs/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
// Icons as SVG components
import { cn } from "@/lib/util/cn"

interface EventCardProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  featured?: boolean
}

export default function EventCard({ product, region, featured = false }: EventCardProps) {
  const { cheapestPrice } = getProductPrice({ product })
  
  // Extract event date from variants or metadata
  const eventDate = product.variants?.[0]?.options?.find(
    (opt: any) => opt.option?.title === "Date"
  )?.value || product.metadata?.event_date as string

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return {
        day: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
    } catch {
      return null
    }
  }

  const dateInfo = eventDate ? formatDate(eventDate) : null
  const venue = product.metadata?.venue_name as string || "TBA"
  const imageUrl = product.thumbnail || product.images?.[0]?.url

  return (
    <LocalizedClientLink href={`/products/${product.handle}`}>
      <Card className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0",
        featured ? "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" : "bg-white dark:bg-slate-900"
      )}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title || "Event"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Date Badge */}
          {dateInfo && (
            <div className="absolute top-4 left-4">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg px-3 py-2 text-center shadow-lg">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  {dateInfo.weekday}
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {dateInfo.day}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {dateInfo.month}
                </div>
              </div>
            </div>
          )}

          {/* Price Badge */}
          {cheapestPrice && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-3 py-1.5 text-sm font-semibold shadow-lg">
                From {cheapestPrice.calculated_price}
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="pb-3">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {product.title}
          </h3>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Event Details */}
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {dateInfo && (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {dateInfo.weekday}, {dateInfo.month} {dateInfo.day}, {dateInfo.year}
                  {dateInfo.time && ` • ${dateInfo.time}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="line-clamp-1">{venue}</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-slate-500 dark:text-slate-500 line-clamp-2">
              {product.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
            variant="default"
          >
            View Details
          </Button>
        </CardFooter>
      </Card>
    </LocalizedClientLink>
  )
}

