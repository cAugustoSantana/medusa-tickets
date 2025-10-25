import { Migration } from "@mikro-orm/migrations"

export class Migration20250104150000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "ticket_product" ADD COLUMN "max_quantity" integer NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "ticket_product" DROP COLUMN "max_quantity";`);
  }
}
