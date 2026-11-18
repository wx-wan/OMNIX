"use client";

import { useTranslation } from "react-i18next";
import { PeopleField } from "../people-field";
import { useWorkspace } from "src/api/workspace/use-workspace";

/** 负责人选择器：统一复用 PeopleField 单选，保留此导出名供详情页调用。 */
export function LeadSelect({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (userId: string) => void;
}) {
  const { t } = useTranslation();
  const { snap } = useWorkspace();
  return (
    <PeopleField
      users={snap?.users ?? []}
      value={value}
      onChange={(next) => next && onChange(next as string)}
      editable
      label={t("Lead")}
    />
  );
}

export default LeadSelect;
