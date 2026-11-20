"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { getFetcher } from "@/api/global-fetcher";
import type { Contact } from "@/api/contacts/use-contacts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteStatus,
} from "@/components/ui/autocomplete";

export type CompanyPick = Pick<Contact, "id" | "name" | "website" | "country" | "source" | "landline">;

const DEBOUNCE_MS = 300;
const SPRING = { type: "spring", bounce: 0.15, duration: 0.3 } as const;

/** shadcn 风格的三点跳动加载动画：当前色圆点依次弹跳，降低动效偏好时静止。 */
function SearchingDots() {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1.5 animate-bounce rounded-full bg-current motion-reduce:animate-none"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </span>
  );
}

/**
 * 公司名称输入：接 autocomplete-05 的异步联想样式，数据来自公司库（isCompany=true）。
 * 防抖查询；无匹配不显示下拉框；选中选择回填官网/国家/来源/座机；
 * 输入的新名称保留为文本，保存时由 submitContactForm 新建公司。
 */
export function CompanyAutocomplete({
  value,
  onChange,
  onPick,
  placeholder,
}: {
  value: string;
  onChange: (name: string) => void;
  onPick?: (company: CompanyPick) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState(value);
  const [debounced, setDebounced] = useState(value);
  // 下拉只在输入聚焦期间存在，失焦即收起；不再由每次输入触发 open。
  const [focused, setFocused] = useState(false);
  const pickedNameRef = useRef<string | null>(null);
  const blurTimerRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);
  const cancelBlur = () => {
    if (blurTimerRef.current !== null) window.clearTimeout(blurTimerRef.current);
    blurTimerRef.current = null;
  };

  useEffect(() => {
    if (pickedNameRef.current === input) {
      pickedNameRef.current = null;
      setDebounced(input);
      return;
    }
    const timer = window.setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [input]);

  const keyword = debounced.trim();
  const key = keyword
    ? `/api/contacts?isCompany=true&q=${encodeURIComponent(keyword)}&limit=20`
    : null;
  const { data, isLoading, isValidating } = useSWR<Contact[]>(key, getFetcher, {
    dedupingInterval: 1000,
    // 新关键词查询期间保留上一次结果，避免闪成 0 家。
    keepPreviousData: true,
  });
  // 从输入变化那一刻（防抖期）到新结果返回前都算“搜索中”，状态行显示加载态。
  const typing = input.trim() !== debounced.trim();
  const searching = Boolean(keyword) && (typing || isLoading || isValidating);
  // 下拉只做已返回数据的展示：查询期间沿用上一次结果；查完 0 家也保持显示，
  // 由状态行显示「0 companies found」，新名称在保存时新建公司。
  const matches = keyword ? data ?? [] : [];
  const visible = Boolean(input.trim());

  useEffect(() => {
    if (matches.length) hasAnimatedRef.current = true;
  }, [matches.length]);

  return (
    <Autocomplete
      defaultInputValue={value}
      open={focused}
      onOpenChange={setFocused}
      onInputValueChange={(next) => {
        setInput(next);
        onChange(next);
      }}
      onValueChange={(id) => {
        if (!id) return;
        const picked = matches.find((company) => company.id === id);
        if (picked) {
          cancelBlur();
          pickedNameRef.current = picked.name;
          onPick?.(picked);
        }
      }}
    >
      <div onMouseDownCapture={cancelBlur}>
        <AutocompleteInput
          placeholder={placeholder}
          showTrigger
          showClear
          onFocus={() => {
            cancelBlur();
            setFocused(true);
          }}
          // 延迟收起，给 portal 里的选项点击留时间（点击会先触发 input 失焦）。
          onBlur={() => {
            cancelBlur();
            blurTimerRef.current = window.setTimeout(() => setFocused(false), 120);
          }}
        />
      </div>
      {/* 聚焦期间下拉容器常驻，仅用 CSS 控制显隐：避免卸载重挂触发的入场动画 */}
      <AutocompleteContent
        className={visible ? undefined : "invisible pointer-events-none"}
      >
        <AutocompleteStatus className="flex items-center gap-2">
          {searching ? (
            <>
              <SearchingDots />
              {t("Searching")}
            </>
          ) : matches.length === 1
            ? t("{{count}} company found", { count: matches.length })
              : t("{{count}} companies found", { count: matches.length })}
        </AutocompleteStatus>
        <AutocompleteList>
          {matches.map((company, idx) => (
            <AutocompleteItem
              key={company.id}
              value={company.id}
              label={company.name}
              className="rounded-lg py-1.5"
            >
              <motion.div
                initial={hasAnimatedRef.current ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={hasAnimatedRef.current ? undefined : { ...SPRING, delay: idx * 0.04 }}
                className="flex w-full items-center gap-2.5"
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback>
                    {company.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{company.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {company.country || company.website || t("Company")}
                  </p>
                </div>
              </motion.div>
            </AutocompleteItem>
          ))}
        </AutocompleteList>
      </AutocompleteContent>
    </Autocomplete>
  );
}
