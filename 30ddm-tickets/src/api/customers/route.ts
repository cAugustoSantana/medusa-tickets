import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "zod"

// Define the schema for customer creation
export const CreateCustomerSchema = z.object({
  email: z.string().email("Invalid email address"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

type CreateCustomerSchema = z.infer<typeof CreateCustomerSchema>

export async function POST(
  req: MedusaRequest<CreateCustomerSchema>,
  res: MedusaResponse
) {
  try {
    // Resolve the customer module service
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)

    // Create the customer with the validated body data
    // Note: createCustomers returns an array, so we take the first element
    const [customer] = await customerModuleService.createCustomers([req.validatedBody])

    res.status(201).json({ customer })
  } catch (error: any) {
    // Handle duplicate email errors
    if (error.message?.includes("email") || error.message?.includes("already exists")) {
      res.status(409).json({
        message: "A customer with this email already exists",
        error: error.message
      })
      return
    }

    res.status(400).json({
      message: error.message || "Failed to create customer",
      error: error
    })
  }
}

