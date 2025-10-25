import { Migration } from "@mikro-orm/migrations"

export class Migration20250104140000 extends Migration {
  async up(): Promise<void> {
    // Make venue_row_id nullable for general access tickets
    this.addSql('ALTER TABLE "ticket_purchase" ALTER COLUMN "venue_row_id" DROP NOT NULL;')
    
    // Also update any existing records that might have NULL venue_row_id to ensure consistency
    this.addSql('UPDATE "ticket_purchase" SET "venue_row_id" = NULL WHERE "venue_row_id" IS NULL;')
  }

  async down(): Promise<void> {
    // First, set any NULL values to a default value (if needed)
    // this.addSql('UPDATE "ticket_purchase" SET "venue_row_id" = \'default\' WHERE "venue_row_id" IS NULL;')
    
    // Revert venue_row_id to NOT NULL
    this.addSql('ALTER TABLE "ticket_purchase" ALTER COLUMN "venue_row_id" SET NOT NULL;')
  }
}
