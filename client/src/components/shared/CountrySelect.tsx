"use client";

import { useState } from "react";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteStatus,
} from "@/components/ui/autocomplete";

/**
 * 国家/地区选择：沿用原 DealForm 的 DEAL_COUNTRY_RECORDS 系统选项（29 项，
 * 与后端 MCP COUNTRY_NORMALIZE 一致），用项目统一的 Autocomplete 块实现可搜索下拉。
 * value/onChange 直接是中文国家名，兼容已有 Contact.country 字符串存储。
 */
export const COUNTRIES = [
  "中国", "中国香港", "中国台湾", "美国", "加拿大", "墨西哥", "巴西",
  "德国", "英国", "法国", "意大利", "西班牙", "荷兰", "波兰", "俄罗斯",
  "土耳其", "日本", "韩国", "印度", "越南", "泰国", "马来西亚",
  "印度尼西亚", "新加坡", "菲律宾", "阿联酋", "沙特阿拉伯", "澳大利亚",
  "南非", "埃及",
] as const;

export function CountrySelect({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (country: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Autocomplete
      defaultInputValue={value}
      onInputValueChange={setQuery}
      onValueChange={(next) => next && onChange(next)}
    >
      <AutocompleteInput
        id={id}
        placeholder={placeholder}
        showTrigger
        showClear
      />
      <AutocompleteContent>
        <AutocompleteStatus>
          {filtered.length} {filtered.length === 1 ? "country" : "countries"}
        </AutocompleteStatus>
        <AutocompleteList>
          {filtered.map((country) => (
            <AutocompleteItem key={country} value={country} label={country}>
              {country}
            </AutocompleteItem>
          ))}
        </AutocompleteList>
      </AutocompleteContent>
    </Autocomplete>
  );
}
