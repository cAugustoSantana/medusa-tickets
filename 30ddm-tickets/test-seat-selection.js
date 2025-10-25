// Test script to verify seat selection functionality
// This script will help debug why sold seats aren't showing as sold

console.log("=== Seat Selection Debug Test ===")

// Test 1: Check if there are any ticket purchases in the database
async function checkTicketPurchases() {
  try {
    const response = await fetch('http://localhost:9000/store/ticket-products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      console.log('❌ Failed to fetch ticket products:', response.status, response.statusText)
      return
    }
    
    const data = await response.json()
    console.log('✅ Ticket products found:', data.length)
    
    if (data.length > 0) {
      const productId = data[0].id
      console.log('Testing with product ID:', productId)
      
      // Test 2: Check seat data for this product
      const seatResponse = await fetch(`http://localhost:9000/store/ticket-products/${productId}/seats?date=2026-06-30`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!seatResponse.ok) {
        console.log('❌ Failed to fetch seat data:', seatResponse.status, seatResponse.statusText)
        return
      }
      
      const seatData = await seatResponse.json()
      console.log('✅ Seat data received:', seatData)
      
      // Check if any seats are marked as purchased
      let purchasedSeats = 0
      seatData.seat_map.forEach(row => {
        row.seats.forEach(seat => {
          if (seat.is_purchased) {
            purchasedSeats++
            console.log(`🔴 Purchased seat: Row ${row.row_number}, Seat ${seat.number}`)
          }
        })
      })
      
      console.log(`📊 Total purchased seats: ${purchasedSeats}`)
      
      if (purchasedSeats === 0) {
        console.log('⚠️  No purchased seats found. This might be why seats aren\'t showing as sold.')
        console.log('💡 Try placing an order first to create some ticket purchases.')
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

// Run the test
checkTicketPurchases()
