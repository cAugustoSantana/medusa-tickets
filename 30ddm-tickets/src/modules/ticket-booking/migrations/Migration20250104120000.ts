import { Migrator } from "@medusajs/framework"

export class Migration20250104120000 extends Migrator {
  async up() {
    // Add ticket_type column to ticket_product table
    await this.query(`
      ALTER TABLE ticket_product 
      ADD COLUMN ticket_type VARCHAR(50) DEFAULT 'seat_based'
    `)
    
    // Update existing records to have seat_based as default
    await this.query(`
      UPDATE ticket_product 
      SET ticket_type = 'seat_based' 
      WHERE ticket_type IS NULL
    `)
  }

  async down() {
    // Remove ticket_type column
    await this.query(`
      ALTER TABLE ticket_product 
      DROP COLUMN ticket_type
    `)
  }
}
