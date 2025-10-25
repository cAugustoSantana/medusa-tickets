// Test to verify seat purchase detection
const testSeatPurchase = async () => {
  try {
    console.log('Testing seat purchase detection...')
    
    // Get ticket products
    const productsResponse = await fetch('http://localhost:9000/store/ticket-products')
    if (!productsResponse.ok) {
      console.log('❌ Cannot fetch ticket products:', productsResponse.status)
      return
    }
    
    const products = await productsResponse.json()
    console.log('✅ Found ticket products:', products.length)
    
    if (products.length === 0) {
      console.log('⚠️ No ticket products found.')
      return
    }
    
    const productId = products[0].id
    console.log('Testing with product:', productId)
    
    // Test seat data with debugging
    const seatsResponse = await fetch(`http://localhost:9000/store/ticket-products/${productId}/seats?date=2026-06-30`)
    if (!seatsResponse.ok) {
      console.log('❌ Cannot fetch seat data:', seatsResponse.status)
      return
    }
    
    const seatData = await seatsResponse.json()
    console.log('✅ Seat data received')
    
    // Check the console output from the server for detailed debugging
    console.log('\n🔍 Check the server console for detailed debugging output')
    console.log('Look for:')
    console.log('- Variant matching details')
    console.log('- Purchase data structure')
    console.log('- Date comparison results')
    console.log('- Row number matching')
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

testSeatPurchase()
