import { useMemo } from "react";
import useSWR from "swr";
import { getFetcher, patchFetcher, postFetcher } from "@/api/global-fetcher";
import type { BusinessCardFile } from "@/components/contacts/contact-business-card";

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
  isCompany?: boolean;
  parentId?: string | null;
  website?: string | null;
  source?: string | null;
  landline?: string | null;
  nickname?: string | null;
  socialPlatform?: string | null;
  socialAccount?: string | null;
  mobile?: string | null;
  jobRank?: string | null;
  birthday?: string | null;
  gender?: string | null;
  position?: string | null;
  contactNotes?: string | null;
  businessCardFront?: BusinessCardFile | null;
  businessCardBack?: BusinessCardFile | null;
};

export type ContactInput = {
  name: string;
  customerType: string;
  phone: string;
  email: string;
  country: string;
  company: string;
  avatarUrl: string;
  website?: string;
  source?: string;
  landline?: string;
  nickname?: string;
  socialPlatform?: string;
  socialAccount?: string;
  mobile?: string;
  jobRank?: string;
  birthday?: string;
  gender?: string;
  position?: string;
  contactNotes?: string;
  parentId?: string;
  isCompany?: boolean;
};

/** 联系人表单提交：公司常用信息落一条 isCompany 的公司库记录，个人联系人 parentId 指向它。 */
export type ContactFormInput = {
  company: {
    name: string;
    website: string;
    country: string;
    source: string;
    landline: string;
  };
  contact: {
    nickname: string;
    email: string;
    socialPlatform: string;
    socialAccount: string;
    mobile: string;
    phone: string;
    jobRank: string;
    position: string;
    birthday: string;
    gender: string;
    avatarUrl: string;
    contactNotes: string;
    businessCardFront: BusinessCardFile | null;
    businessCardBack: BusinessCardFile | null;
  };
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

/**
 * 两段式联系人表单落库（幂等 upsert）：
 * 1) 公司按名称查重（公司库 isCompany=true），存在则更新、否则新建；
 * 2) 联系人优先复用任务已关联的 id，否则按邮箱查重，最后才新建；
 *    email 留空时不提交该字段，避免撞唯一约束（P2002）。
 */
export async function submitContactForm(input: ContactFormInput, taskId?: string): Promise<Contact> {
  const companyName = input.company.name.trim();
  const existingCompanies = await getFetcher(`/api/contacts?isCompany=true&q=${encodeURIComponent(companyName)}&limit=20`) as Contact[];
  const companyMatch = existingCompanies.find((item) => item.name.trim() === companyName);
  const companyPayload = {
    website: input.company.website,
    country: input.company.country,
    source: input.company.source,
    landline: input.company.landline,
  };
  const company = companyMatch
    ? await patchFetcher(`/api/contacts/${companyMatch.id}`, companyPayload) as Contact
    : await postFetcher("/api/contacts", { name: companyName, isCompany: true, ...companyPayload }) as Contact;

  const contactPayload: Record<string, unknown> = {
    name: input.contact.nickname.trim() || companyName,
    nickname: input.contact.nickname,
    ...(input.contact.email.trim() ? { email: input.contact.email.trim() } : {}),
    phone: input.contact.phone,
    mobile: input.contact.mobile,
    landline: input.company.landline,
    socialPlatform: input.contact.socialPlatform,
    socialAccount: input.contact.socialAccount,
    jobRank: input.contact.jobRank,
    position: input.contact.position,
    birthday: input.contact.birthday,
    gender: input.contact.gender,
    avatarUrl: input.contact.avatarUrl,
    contactNotes: input.contact.contactNotes,
    businessCardFront: input.contact.businessCardFront,
    businessCardBack: input.contact.businessCardBack,
    parentId: company.id,
  };

  // 优先复用任务已关联的联系人；否则按邮箱查重，避免重复创建触发唯一约束。
  let existingContactId: string | null = null;
  if (taskId) existingContactId = await getTaskContactId(taskId);
  if (!existingContactId && contactPayload.email) {
    const email = input.contact.email.trim();
    const byEmail = await getFetcher(`/api/contacts?q=${encodeURIComponent(email)}&limit=20`) as Contact[];
    existingContactId = byEmail.find((item) => item.email === email)?.id ?? null;
  }
  const contact = existingContactId
    ? await patchFetcher(`/api/contacts/${existingContactId}`, contactPayload) as Contact
    : await postFetcher("/api/contacts", { ...contactPayload, isCompany: false }) as Contact;

  // 关联到当前任务，供再次打开时回填表单。
  if (taskId) {
    await patchFetcher(`/api/tasks/${taskId}/contact`, { contactId: contact.id });
  }
  return contact;
}

/** 读取任务关联的联系人 id（无关联返回 null）。 */
export async function getTaskContactId(taskId: string): Promise<string | null> {
  const result = await getFetcher(`/api/tasks/${taskId}/contact`) as { contactId: string | null };
  return result.contactId;
}

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
