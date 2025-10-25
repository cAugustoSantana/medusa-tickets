import {
    Input,
    Label,
    Text,
    Heading,
    Container,
    Badge,
  } from "@medusajs/ui"
  import { RowType, Venue } from "../types"
  
  export interface CurrencyRegionCombination {
    currency: string
    region_id?: string
    region_name?: string
    is_store_currency: boolean
  }
  
interface PricingStepProps {
  selectedVenue: Venue | undefined
  currencyRegionCombinations: CurrencyRegionCombination[]
  prices: Record<string, Record<string, number>>
  setPrices: (prices: Record<string, Record<string, number>>) => void
  ticketType: "seat_based" | "general_access"
  maxQuantity?: number
  setMaxQuantity?: (quantity: number) => void
}
  
export const PricingStep = ({
  selectedVenue,
  currencyRegionCombinations,
  prices,
  setPrices,
  ticketType,
  maxQuantity,
  setMaxQuantity,
}: PricingStepProps) => {
    if (!selectedVenue) {
      return (
        <div className="text-center py-8">
          <Text>Please select a venue in the previous step</Text>
        </div>
      )
    }
  
    const updatePrice = (
        rowType: string, 
        currency: string, 
        regionId: string | undefined, 
        amount: number
      ) => {
        const key = regionId ? `${currency}_${regionId}` : `${currency}_store`
        setPrices({
          ...prices,
          [rowType]: {
            ...prices[rowType],
            [key]: amount,
          },
        })
      }
      
      const getRowTypeColor = (
        type: RowType
      ): "purple" | "orange" | "blue" | "grey" => {
        switch (type) {
          case RowType.VIP:
            return "purple"
          case RowType.PREMIUM:
            return "orange"
          case RowType.BALCONY:
            return "blue"
          default:
            return "grey"
        }
      }
      
      const getRowTypeLabel = (type: RowType) => {
        switch (type) {
          case RowType.VIP:
            return "VIP"
          default:
            return type.charAt(0).toUpperCase() + type.slice(1)
        }
      }
      
      // Get unique row types from venue
      const rowTypes = [...new Set(selectedVenue.rows.map((row) => row.row_type))]
      
      return (
        <div className="space-y-6">
          <div>
            <Heading level="h3">
              {ticketType === "general_access" ? "Set General Access Ticket Price" : "Set Prices for Each Row Type"}
            </Heading>
            <Text className="text-ui-fg-subtle">
              {ticketType === "general_access" 
                ? "Enter the price and maximum quantity for general access tickets by region and currency. At least one price is required. Leave quantity empty to use venue capacity."
                : "Enter prices for each row type by region and currency. All prices are optional."
              }
            </Text>
          </div>
      
          <div className="space-y-4">
            {ticketType === "general_access" ? (
              // General Access Pricing
              <div className="bg-ui-bg-subtle rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge color="blue">General Access</Badge>
                  <Text className="txt-small text-ui-fg-subtle">
                    Total Capacity: {selectedVenue.rows.reduce((sum, row) => sum + row.seat_count, 0)} tickets
                  </Text>
                </div>
                
                {/* Quantity Selection */}
                {setMaxQuantity && (
                  <div className="mb-6 p-4 bg-ui-bg-base rounded-lg border">
                    <Label htmlFor="max_quantity" className="text-base font-medium">
                      Maximum Quantity
                    </Label>
                    <Text className="txt-small text-ui-fg-subtle mb-2">
                      Set the maximum number of tickets available for this event. Leave empty to use venue capacity ({selectedVenue.rows.reduce((sum, row) => sum + row.seat_count, 0)} tickets).
                    </Text>
                    <Input
                      id="max_quantity"
                      type="number"
                      min="1"
                      value={maxQuantity || ""}
                      onChange={(e) => setMaxQuantity(parseInt(e.target.value) || 0)}
                      placeholder={`${selectedVenue.rows.reduce((sum, row) => sum + row.seat_count, 0)} (venue capacity)`}
                      className="max-w-xs"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currencyRegionCombinations.map((combo) => {
                    const key = combo.region_id ? `${combo.currency}_${combo.region_id}` : `${combo.currency}_store`
                    const currentPrice = prices["general_access"]?.[key] || 0
                    
                    return (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={`general_access_${key}`}>
                          {combo.currency.toUpperCase()} {combo.region_name ? `(${combo.region_name})` : '(Store Default)'} *
                        </Label>
                        <Input
                          id={`general_access_${key}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={currentPrice}
                          onChange={(e) => updatePrice("general_access", combo.currency, combo.region_id, parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              // Seat-Based Pricing
              rowTypes.map((rowType) => {
                const totalSeats = selectedVenue.rows
                  .filter((row) => row.row_type === rowType)
                  .reduce((sum, row) => sum + row.seat_count, 0)
      
              return (
                <Container key={rowType} className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge color={getRowTypeColor(rowType as RowType)} size="small">
                      {getRowTypeLabel(rowType)}
                    </Badge>
                    <Text className="txt-small text-ui-fg-subtle">
                      {totalSeats} seats total
                    </Text>
                  </div>
      
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currencyRegionCombinations.map((combo) => {
                      const key = combo.region_id ? `${combo.currency}_${combo.region_id}` : `${combo.currency}_store`
                      return (
                        <div key={key}>
                          <Label htmlFor={`${rowType}-${key}`}>
                            {combo.currency.toUpperCase()} - {combo.region_name || "Store"}
                          </Label>
                          <Input
                            id={`${rowType}-${key}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={prices[rowType]?.[key] || ""}
                            onChange={(e) => {
                              const amount = parseFloat(e.target.value) || 0
                              updatePrice(rowType, combo.currency, combo.region_id, amount)
                            }}
                            placeholder="0.00"
                          />
                        </div>
                      )
                    })}
                  </div>
                </Container>
              )
            })
            )}
          </div>
        </div>
      )
  }