-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('customer', 'supplier', 'user');

-- CreateTable
CREATE TABLE "stages" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "accent" TEXT NOT NULL DEFAULT 'bg-slate-400',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "type" "ContactType" NOT NULL DEFAULT 'customer',
    "customerType" TEXT,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "is_company" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "website" TEXT,
    "password" TEXT,
    "role" TEXT,
    "position" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "botCharacter" TEXT DEFAULT 'mochi',
    "avatar_url" TEXT,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "source_product_id" TEXT,
    "mode" TEXT,
    "process" TEXT,
    "audience" TEXT,
    "category" TEXT,
    "price" DECIMAL(12,2),
    "costPrice" DECIMAL(12,2),
    "tax" DECIMAL(5,2),
    "image" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requirement',
    "released_at" TIMESTAMP(3),
    "obsoleted_at" TIMESTAMP(3),
    "part_no" TEXT,
    "revision" TEXT NOT NULL DEFAULT 'A',
    "revision_parent_id" TEXT,
    "drawings" JSONB,
    "parent_id" TEXT,
    "is_requirement" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_items" (
    "id" TEXT NOT NULL,
    "parent_product_id" TEXT NOT NULL,
    "child_product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "position" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tag" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "amount" DECIMAL(12,2),
    "assignee" TEXT,
    "meta" TEXT,
    "source" TEXT,
    "stageId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "contact_id" TEXT,
    "product_id" TEXT,
    "lines_json" TEXT,
    "price_include_tax" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fees" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "voucher_url" TEXT,
    "attachments" JSONB,
    "paid_at" TIMESTAMP(3),
    "fund_account" TEXT,
    "ref_type" TEXT,
    "ref_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_orders" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "responsible_id" TEXT,
    "assistant_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "mainImage" JSONB,
    "threeViews" JSONB,
    "design_fee_amount" DECIMAL(12,2),
    "due_date" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_orders" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "product_id" TEXT,
    "design_order_id" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "responsible_id" TEXT,
    "assistant_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "color_code" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "craft" TEXT,
    "material" TEXT,
    "hardness" TEXT,
    "length" DECIMAL(10,2),
    "width" DECIMAL(10,2),
    "height" DECIMAL(10,2),
    "required_completion" TIMESTAMP(3),
    "order_date" TIMESTAMP(3),
    "functional_req" TEXT,
    "packagingImage" JSONB,
    "engravingImage" JSONB,
    "other_attachments" JSONB,
    "acceptance_criteria" TEXT,
    "packaging_length" DECIMAL(10,2),
    "packaging_width" DECIMAL(10,2),
    "packaging_height" DECIMAL(10,2),
    "sampleFiles" JSONB,
    "tracking_no" TEXT,
    "recipient" TEXT,
    "createdBy" TEXT,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_stage_logs" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "stageKey" TEXT NOT NULL,
    "stageTitle" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "deal_stage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatter_messages" (
    "id" TEXT NOT NULL,
    "resModel" TEXT NOT NULL,
    "resId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorIsBot" BOOLEAN NOT NULL DEFAULT false,
    "author_avatar" TEXT,
    "isRecall" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT NOT NULL,
    "attachment_name" TEXT,
    "attachment_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatter_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "shipping_address" TEXT,
    "valid_until" TIMESTAMP(3),
    "payment_terms" TEXT,
    "trade_terms" TEXT,
    "delivery_date" TIMESTAMP(3),
    "lines_json" TEXT,
    "amount" DECIMAL(12,2),
    "notes" TEXT,
    "price_include_tax" BOOLEAN NOT NULL DEFAULT false,
    "template_id" TEXT,
    "document_json" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL DEFAULT 'quotation',
    "sheetSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'mcp',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessExpiresAt" TIMESTAMP(3) NOT NULL,
    "refreshExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "sid" TEXT NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE UNIQUE INDEX "stages_key_key" ON "stages"("key");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_email_key" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_type_idx" ON "contacts"("type");

-- CreateIndex
CREATE INDEX "contacts_parent_id_idx" ON "contacts"("parent_id");

-- CreateIndex
CREATE INDEX "contacts_is_company_archived_idx" ON "contacts"("is_company", "archived");

-- CreateIndex
CREATE INDEX "contacts_createdAt_idx" ON "contacts"("createdAt");

-- CreateIndex
CREATE INDEX "products_source_product_id_idx" ON "products"("source_product_id");

-- CreateIndex
CREATE INDEX "products_parent_id_idx" ON "products"("parent_id");

-- CreateIndex
CREATE INDEX "products_part_no_idx" ON "products"("part_no");

-- CreateIndex
CREATE INDEX "bom_items_parent_product_id_idx" ON "bom_items"("parent_product_id");

-- CreateIndex
CREATE INDEX "bom_items_child_product_id_idx" ON "bom_items"("child_product_id");

-- CreateIndex
CREATE INDEX "deals_stageId_idx" ON "deals"("stageId");

-- CreateIndex
CREATE INDEX "deals_contact_id_idx" ON "deals"("contact_id");

-- CreateIndex
CREATE INDEX "deals_product_id_idx" ON "deals"("product_id");

-- CreateIndex
CREATE INDEX "fees_deal_id_idx" ON "fees"("deal_id");

-- CreateIndex
CREATE INDEX "fees_ref_type_idx" ON "fees"("ref_type");

-- CreateIndex
CREATE INDEX "fees_ref_id_idx" ON "fees"("ref_id");

-- CreateIndex
CREATE INDEX "design_orders_deal_id_idx" ON "design_orders"("deal_id");

-- CreateIndex
CREATE INDEX "design_orders_product_id_idx" ON "design_orders"("product_id");

-- CreateIndex
CREATE INDEX "design_orders_responsible_id_idx" ON "design_orders"("responsible_id");

-- CreateIndex
CREATE INDEX "design_orders_assistant_id_idx" ON "design_orders"("assistant_id");

-- CreateIndex
CREATE INDEX "sample_orders_deal_id_idx" ON "sample_orders"("deal_id");

-- CreateIndex
CREATE INDEX "sample_orders_product_id_idx" ON "sample_orders"("product_id");

-- CreateIndex
CREATE INDEX "sample_orders_design_order_id_idx" ON "sample_orders"("design_order_id");

-- CreateIndex
CREATE INDEX "sample_orders_responsible_id_idx" ON "sample_orders"("responsible_id");

-- CreateIndex
CREATE INDEX "sample_orders_assistant_id_idx" ON "sample_orders"("assistant_id");

-- CreateIndex
CREATE INDEX "deal_stage_logs_dealId_idx" ON "deal_stage_logs"("dealId");

-- CreateIndex
CREATE INDEX "chatter_messages_resModel_resId_idx" ON "chatter_messages"("resModel", "resId");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_number_key" ON "quotations"("number");

-- CreateIndex
CREATE INDEX "quotations_deal_id_idx" ON "quotations"("deal_id");

-- CreateIndex
CREATE INDEX "quotations_contact_id_idx" ON "quotations"("contact_id");

-- CreateIndex
CREATE INDEX "quotations_template_id_idx" ON "quotations"("template_id");

-- CreateIndex
CREATE INDEX "quotation_templates_doc_type_idx" ON "quotation_templates"("doc_type");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_tokens_accessToken_key" ON "oauth_tokens"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_tokens_refreshToken_key" ON "oauth_tokens"("refreshToken");

-- CreateIndex
CREATE INDEX "oauth_tokens_userId_clientId_scope_idx" ON "oauth_tokens"("userId", "clientId", "scope");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_revision_parent_id_fkey" FOREIGN KEY ("revision_parent_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_parent_product_id_fkey" FOREIGN KEY ("parent_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_child_product_id_fkey" FOREIGN KEY ("child_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fees" ADD CONSTRAINT "fees_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_orders" ADD CONSTRAINT "design_orders_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_orders" ADD CONSTRAINT "design_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_orders" ADD CONSTRAINT "design_orders_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_orders" ADD CONSTRAINT "design_orders_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_orders" ADD CONSTRAINT "sample_orders_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_orders" ADD CONSTRAINT "sample_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_orders" ADD CONSTRAINT "sample_orders_design_order_id_fkey" FOREIGN KEY ("design_order_id") REFERENCES "design_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_orders" ADD CONSTRAINT "sample_orders_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_orders" ADD CONSTRAINT "sample_orders_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_stage_logs" ADD CONSTRAINT "deal_stage_logs_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_stage_logs" ADD CONSTRAINT "deal_stage_logs_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

