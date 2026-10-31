-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('customer', 'supplier', 'user');

-- DropForeignKey
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_customerId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_customer_id_fkey";

-- DropIndex
DROP INDEX "contacts_customerId_idx";

-- DropIndex
DROP INDEX "deals_customer_id_idx";

-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "customerId",
ADD COLUMN     "company" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "type" "ContactType" NOT NULL DEFAULT 'customer',
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "deals" DROP COLUMN "customer_id",
ADD COLUMN     "contact_id" TEXT;

-- DropTable
DROP TABLE "customers";

-- DropTable
DROP TABLE "users";

-- CreateIndex
CREATE INDEX "contacts_type_idx" ON "contacts"("type");

-- CreateIndex
CREATE INDEX "deals_contact_id_idx" ON "deals"("contact_id");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

