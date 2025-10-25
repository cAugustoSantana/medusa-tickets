// Simple test to check ticket purchases directly
const testTicketPurchases = async () => {
  try {
    console.log('Testing ticket purchases...')
    
    // First, let's check if we can get ticket products
    const productsResponse = await fetch('http://localhost:9000/store/ticket-products')
    if (!productsResponse.ok) {
      console.log('❌ Cannot fetch ticket products:', productsResponse.status)
      return
    }
    
    const products = await productsResponse.json()
    console.log('✅ Found ticket products:', products.length)
    
    if (products.length === 0) {
      console.log('⚠️ No ticket products found. Create a ticket product first.')
      return
    }
    
    const productId = products[0].id
    console.log('Testing with product:', productId)
    
    // Now let's check the seat data
    const seatsResponse = await fetch(`http://localhost:9000/store/ticket-products/${productId}/seats?date=2026-06-30`)
    if (!seatsResponse.ok) {
      console.log('❌ Cannot fetch seat data:', seatsResponse.status)
      return
    }
    
    const seatData = await seatsResponse.json()
    console.log('✅ Seat data received')
    console.log('Seat map structure:', JSON.stringify(seatData.seat_map, null, 2))
    
    // Check for purchased seats
    let totalSeats = 0
    let purchasedSeats = 0
    
    seatData.seat_map.forEach(row => {
      console.log(`Row ${row.row_number} (${row.row_type}):`)
      row.seats.forEach(seat => {
        totalSeats++
        if (seat.is_purchased) {
          purchasedSeats++
          console.log(`  🔴 Seat ${seat.number}: PURCHASED`)
        } else {
          console.log(`  🟢 Seat ${seat.number}: Available`)
        }
      })
    })
    
    console.log(`\n📊 Summary:`)
    console.log(`Total seats: ${totalSeats}`)
    console.log(`Purchased seats: ${purchasedSeats}`)
    console.log(`Available seats: ${totalSeats - purchasedSeats}`)
    
    if (purchasedSeats === 0) {
      console.log('\n💡 No purchased seats found. This explains why the seat modal shows all seats as available.')
      console.log('To test sold seats:')
      console.log('1. Place an order with some seats')
      console.log('2. Check the seat modal again')
      console.log('3. The purchased seats should show as "Sold"')
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

testTicketPurchases()
