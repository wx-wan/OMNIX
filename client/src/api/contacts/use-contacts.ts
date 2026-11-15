import { useMemo } from "react";
import useSWR from "swr";
import { getFetcher, patchFetcher, postFetcher } from "@/api/global-fetcher";

/** 联系人应用的数据契约：直接用后端 Contact 现有字段，不新增列。
 *  dept→customerType、address→country；starred/notes 走 Setting KV。 */
export type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  customerType: string | null;
  country: string | null;
  company: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type ContactInput = {
  name: string;
  customerType: string;
  phone: string;
  email: string;
  country: string;
  company: string;
  avatarUrl: string;
};

type UiMeta = {
  starred: Record<string, boolean>;
  notes: Record<string, string>;
};

const LIST_KEY = "/api/contacts?limit=200";
const META_KEY = "/api/contacts/ui-meta";
const DEPTS = ["Sales", "Support", "Engineering"];
/** 首次落库的 12 条按原 UI 顺序展示；新增项排在后面。 */
const SEED_ORDER = [
  "Georgeanna Ramero", "Cami Macha", "Alda Ziemer", "Luciano Macpherson",
  "Dalton Paden", "Juan Granado", "Revan Allen", "Juley Huseman",
  "Bridgette Phung", "Ernest Cousins", "Nicolette Trapani", "Virginia Bourdeau",
];

export function useContacts() {
  const { data, error, isLoading, mutate } = useSWR<Contact[]>(LIST_KEY, getFetcher);
  const { data: meta, mutate: mutateMeta } = useSWR<UiMeta>(META_KEY, getFetcher);

  const contacts = useMemo(() => {
    const rows = (data ?? []).filter((c) => DEPTS.includes(c.customerType ?? ""));
    return [...rows].sort((a, b) => {
      const ia = SEED_ORDER.indexOf(a.name);
      const ib = SEED_ORDER.indexOf(b.name);
      return (ia === -1 ? SEED_ORDER.length : ia) - (ib === -1 ? SEED_ORDER.length : ib) ||
        b.createdAt.localeCompare(a.createdAt);
    });
  }, [data]);

  async function create(input: ContactInput) {
    const created = await postFetcher("/api/contacts", {
      ...input,
      isCompany: false,
    });
    await mutate();
    return created as Contact;
  }

  async function update(id: string, input: Partial<ContactInput>) {
    const updated = await patchFetcher(`/api/contacts/${id}`, input);
    await mutate();
    return updated as Contact;
  }

  async function remove(id: string) {
    // 后端 DELETE 返回 204 No Content，全局 deleteFetcher 会尝试 res.json() 而失败，故此处直接 fetch。
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: "删除失败" }));
      throw new Error(body.message ?? "删除失败");
    }
    await mutate();
  }

  async function setStarred(id: string, starred: boolean) {
    await patchFetcher(`/api/contacts/ui-meta/${id}`, { starred });
    await mutateMeta();
  }

  async function setNotes(id: string, notes: string) {
    await patchFetcher(`/api/contacts/ui-meta/${id}`, { notes });
    await mutateMeta();
  }

  return {
    contacts,
    starred: meta?.starred ?? {},
    notes: meta?.notes ?? {},
    isLoading,
    error,
    create,
    update,
    remove,
    setStarred,
    setNotes,
  };
}
