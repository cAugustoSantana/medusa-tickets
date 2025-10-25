// Test to check if ticket purchases exist in the database
const testDatabase = async () => {
  try {
    console.log('Testing database connection...')
    
    // This is a simple test to see if we can connect to the database
    // and check if there are any ticket purchases
    
    const response = await fetch('http://localhost:9000/admin/ticket-purchases', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Ticket purchases found:', data.length)
      if (data.length > 0) {
        console.log('Sample purchase:', data[0])
      }
    } else {
      console.log('❌ Cannot fetch ticket purchases:', response.status)
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

testDatabase()
