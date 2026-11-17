import useSWR from "swr";
import { getFetcher, patchFetcher } from "@/api/global-fetcher";

/** 成员 = 系统已注册的可登录用户（后端 /api/auth/users，排除机器人与服务号）。 */
export type MemberUser = {
  id: string;
  email: string;
  name: string;
  role: string; // super_admin | admin | user | viewer
  avatarUrl: string; // 真实头像路径
  department: string | null; // 部门，成员页「部门」列
  createdAt: string; // ISO，加入时间列
};

/** 后端角色值 ↔ 页面展示文案 key。 */
export const ROLE_KEYS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  user: "Member",
  viewer: "Viewer",
};

export function roleLabel(role: string) {
  return ROLE_KEYS[role] ?? "Member";
}

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR<MemberUser[]>(
    "/api/auth/users",
    getFetcher,
  );

  async function updateRole(id: string, role: string) {
    await patchFetcher(`/api/auth/users/${id}`, { role });
    await mutate();
  }

  async function remove(id: string) {
    // 后端返回 204 无 body，不能用会 res.json() 的 deleteFetcher。
    const res = await fetch(`/api/auth/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: "移除失败" }));
      throw new Error(body.message ?? "移除失败");
    }
    await mutate();
  }

  return {
    users: data ?? [],
    error,
    isLoading,
    updateRole,
    remove,
  };
}
