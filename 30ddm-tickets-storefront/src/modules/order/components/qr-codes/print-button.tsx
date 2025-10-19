"use client"

import { Button } from "@medusajs/ui"

const PrintButton = () => {
  return (
    <Button 
      variant="secondary" 
      size="small"
      onClick={() => window.print()}
    >
      Print QR Codes
    </Button>
  )
}

export default PrintButton
