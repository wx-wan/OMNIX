-- 报价单：商机推进到「报价」阶段时生成（一商多单），客户引用商机客户，明细快照自商机产品需求
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "shipping_address" TEXT,
    "valid_until" TIMESTAMP(3),
    "payment_terms" TEXT,
    "delivery_date" TIMESTAMP(3),
    "lines_json" TEXT,
    "amount" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quotations_number_key" ON "quotations"("number");
CREATE INDEX "quotations_deal_id_idx" ON "quotations"("deal_id");
CREATE INDEX "quotations_contact_id_idx" ON "quotations"("contact_id");

ALTER TABLE "quotations" ADD CONSTRAINT "quotations_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
