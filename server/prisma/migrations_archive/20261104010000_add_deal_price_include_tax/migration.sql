-- 商机价格含税标记（true=单价含税倒算税额，false=单价不含税税额另计，默认含税对齐前端）
ALTER TABLE deals ADD COLUMN "price_include_tax" BOOLEAN NOT NULL DEFAULT true;
