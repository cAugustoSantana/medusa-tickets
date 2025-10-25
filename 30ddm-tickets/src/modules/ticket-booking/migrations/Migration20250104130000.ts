import { Migration } from '@mikro-orm/migrations';

export class Migration20250104130000 extends Migration {
  override async up(): Promise<void> {
    // Update venue_row table to allow 'general_access' in row_type check constraint
    this.addSql(`ALTER TABLE "venue_row" DROP CONSTRAINT IF EXISTS "venue_row_row_type_check";`);
    this.addSql(`ALTER TABLE "venue_row" ADD CONSTRAINT "venue_row_row_type_check" CHECK ("row_type" IN ('premium', 'balcony', 'standard', 'vip', 'general_access'));`);
    
    // Update ticket_product_variant table to allow 'general_access' in row_type check constraint
    this.addSql(`ALTER TABLE "ticket_product_variant" DROP CONSTRAINT IF EXISTS "ticket_product_variant_row_type_check";`);
    this.addSql(`ALTER TABLE "ticket_product_variant" ADD CONSTRAINT "ticket_product_variant_row_type_check" CHECK ("row_type" IN ('premium', 'balcony', 'standard', 'vip', 'general_access'));`);
  }

  override async down(): Promise<void> {
    // Revert the check constraints to original values
    this.addSql(`ALTER TABLE "venue_row" DROP CONSTRAINT IF EXISTS "venue_row_row_type_check";`);
    this.addSql(`ALTER TABLE "venue_row" ADD CONSTRAINT "venue_row_row_type_check" CHECK ("row_type" IN ('premium', 'balcony', 'standard', 'vip'));`);
    
    this.addSql(`ALTER TABLE "ticket_product_variant" DROP CONSTRAINT IF EXISTS "ticket_product_variant_row_type_check";`);
    this.addSql(`ALTER TABLE "ticket_product_variant" ADD CONSTRAINT "ticket_product_variant_row_type_check" CHECK ("row_type" IN ('premium', 'balcony', 'standard', 'vip'));`);
  }
}
