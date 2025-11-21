import { CreateCustomerSchema } from '../route'

describe('CreateCustomerSchema', () => {
  describe('Valid inputs', () => {
    it('should validate a complete customer object with all fields', () => {
      const validCustomer = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        metadata: { source: 'website' },
      }

      const result = CreateCustomerSchema.safeParse(validCustomer)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validCustomer)
      }
    })

    it('should validate a customer object with only required fields', () => {
      const validCustomer = {
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
      }

      const result = CreateCustomerSchema.safeParse(validCustomer)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
        expect(result.data.first_name).toBe('Jane')
        expect(result.data.last_name).toBe('Smith')
      }
    })

    it('should validate with optional phone field', () => {
      const validCustomer = {
        email: 'user@example.com',
        first_name: 'Bob',
        last_name: 'Johnson',
        phone: '555-1234',
      }

      const result = CreateCustomerSchema.safeParse(validCustomer)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.phone).toBe('555-1234')
      }
    })

    it('should validate with optional metadata field', () => {
      const validCustomer = {
        email: 'user@example.com',
        first_name: 'Alice',
        last_name: 'Williams',
        metadata: { customField: 'value', anotherField: 123 },
      }

      const result = CreateCustomerSchema.safeParse(validCustomer)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata).toEqual({ customField: 'value', anotherField: 123 })
      }
    })
  })

  describe('Invalid inputs', () => {
    it('should reject invalid email format', () => {
      const invalidCustomer = {
        email: 'not-an-email',
        first_name: 'John',
        last_name: 'Doe',
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email')
      }
    })

    it('should reject missing email', () => {
      const invalidCustomer = {
        first_name: 'John',
        last_name: 'Doe',
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path[0] === 'email')).toBe(true)
      }
    })

    it('should reject missing first_name', () => {
      const invalidCustomer = {
        email: 'test@example.com',
        last_name: 'Doe',
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.path[0] === 'first_name'
        )).toBe(true)
      }
    })

    it('should reject empty first_name', () => {
      const invalidCustomer = {
        email: 'test@example.com',
        first_name: '',
        last_name: 'Doe',
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.path[0] === 'first_name'
        )).toBe(true)
      }
    })

    it('should reject missing last_name', () => {
      const invalidCustomer = {
        email: 'test@example.com',
        first_name: 'John',
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.path[0] === 'last_name'
        )).toBe(true)
      }
    })

    it('should reject empty last_name', () => {
      const invalidCustomer = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: '',
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.path[0] === 'last_name'
        )).toBe(true)
      }
    })

    it('should reject empty email string', () => {
      const invalidCustomer = {
        email: '',
        first_name: 'John',
        last_name: 'Doe',
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.path[0] === 'email'
        )).toBe(true)
      }
    })
  })

  describe('Edge cases', () => {
    it('should accept valid email with various formats', () => {
      const emails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
      ]

      emails.forEach(email => {
        const customer = {
          email,
          first_name: 'Test',
          last_name: 'User',
        }
        const result = CreateCustomerSchema.safeParse(customer)
        expect(result.success).toBe(true)
      })
    })

    it('should accept single character names', () => {
      const customer = {
        email: 'test@example.com',
        first_name: 'A',
        last_name: 'B',
      }

      const result = CreateCustomerSchema.safeParse(customer)
      expect(result.success).toBe(true)
    })

    it('should accept empty metadata object', () => {
      const customer = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        metadata: {},
      }

      const result = CreateCustomerSchema.safeParse(customer)
      expect(result.success).toBe(true)
    })
  })
})

