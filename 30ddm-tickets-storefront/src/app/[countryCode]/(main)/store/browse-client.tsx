"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HttpTypes } from "@medusajs/types"
import EventCard from "@modules/products/components/event-card"

const CATEGORIES = ["Music Festival", "Conference", "Sports", "Comedy", "Art & Culture", "Food & Drink"]

interface BrowseClientProps {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  initialQuery: string
  initialLocation: string
}

export default function BrowseClient({
  products,
  region,
  initialQuery,
  initialLocation,
}: BrowseClientProps) {
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Filter events based on all criteria
  const filteredEvents = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        query === "" ||
        product.title?.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase())

      const venue = product.metadata?.venue_name as string || ""
      const matchesLocation = location === "" || venue.toLowerCase().includes(location.toLowerCase())

      const category = product.metadata?.category as string || product.collection?.title || ""
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(category)

      return matchesQuery && matchesLocation && matchesCategory
    })
  }, [query, location, selectedCategories, products])

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="content-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Browse Events</h1>

          {/* Search Bar */}
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search events, artists, or venues..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </Button>
          </div>

          {/* Active Filters Display */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategories.map((cat) => (
                <div
                  key={cat}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {cat}
                  <button onClick={() => toggleCategory(cat)} className="hover:opacity-70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          {showFilters && (
            <div className="lg:col-span-1 space-y-6 mb-6 lg:mb-0">
              <div>
                <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Category</h3>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer hover:opacity-70">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  setSelectedCategories([])
                  setQuery("")
                  setLocation("")
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}

          {/* Events Grid */}
          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            {filteredEvents.length > 0 ? (
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((product) => (
                    <EventCard key={product.id} product={product} region={region} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">No events found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Try adjusting your filters or search terms</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategories([])
                    setQuery("")
                    setLocation("")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

