// Test to check date format mismatch
const testDateFormats = async () => {
  try {
    console.log('Testing date formats...')
    
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
    
    // Get availability to see what dates are available
    const availabilityResponse = await fetch(`http://localhost:9000/store/ticket-products/${productId}/availability`)
    if (!availabilityResponse.ok) {
      console.log('❌ Cannot fetch availability:', availabilityResponse.status)
      return
    }
    
    const availabilityData = await availabilityResponse.json()
    console.log('✅ Availability data received')
    console.log('Available dates:', availabilityData.availability.map(a => a.date))
    
    // Test with the first available date
    const firstDate = availabilityData.availability[0]?.date
    if (firstDate) {
      console.log('Testing seats API with date:', firstDate)
      
      const seatsResponse = await fetch(`http://localhost:9000/store/ticket-products/${productId}/seats?date=${firstDate}`)
      if (seatsResponse.ok) {
        console.log('✅ Seats API worked with date:', firstDate)
      } else {
        const errorText = await seatsResponse.text()
        console.log('❌ Seats API failed:', seatsResponse.status, errorText)
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

testDateFormats()
