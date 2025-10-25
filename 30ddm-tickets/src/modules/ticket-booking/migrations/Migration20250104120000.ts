import { Migration } from '@mikro-orm/migrations';

export class Migration20250104120000 extends Migration {
  override async up(): Promise<void> {
    // Add ticket_type column to ticket_product table
    this.addSql(`ALTER TABLE "ticket_product" ADD COLUMN "ticket_type" text check ("ticket_type" in ('seat_based', 'general_access')) not null default 'seat_based';`);
    
    // Update existing records to have seat_based as default
    this.addSql(`UPDATE "ticket_product" SET "ticket_type" = 'seat_based' WHERE "ticket_type" IS NULL;`);
  }

  override async down(): Promise<void> {
    // Remove ticket_type column
    this.addSql(`ALTER TABLE "ticket_product" DROP COLUMN "ticket_type";`);
  }
}
