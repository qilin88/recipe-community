import type { FeedData, Comment, Post } from "./types";
import type { Query } from "./domain";
export type Asset = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export async function requestJSON<T>(
  base: string,
  path: string,
  token: string | null,
  body?: unknown,
): Promise<T> {
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const form = body instanceof FormData;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = "Bearer " + token;
    if (body && !form) headers["Content-Type"] = "application/json";
    const response = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers,
      body: form ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const content = response.headers.get("content-type") || "";
    if (!content.includes("application/json"))
      throw new ApiError(
        "服务器返回了登录页或非API响应，请检查API地址和访问权限",
        response.status,
      );
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.error || "请求失败，请重试", response.status);
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error && e.name === "AbortError")
      throw new Error("请求超时，请检查网络后重试");
    throw new Error("无法连接服务器，请检查服务地址与网络");
  } finally {
    clearTimeout(timeout);
  }
}
export function resolvePost(p: Post, base: string): Post {
  const url = (s: string) => (s.startsWith("/") ? base + s : s);
  return {
    ...p,
    images: p.images.map(url),
    steps: p.steps.map((s) => ({
      ...s,
      ...(s.image ? { image: url(s.image) } : {}),
    })),
  };
}
export async function remoteFeed(
  base: string,
  token: string | null,
  query: Query,
) {
  const q = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  const data = await requestJSON<FeedData>(base, "/api/community?" + q, token);
  return { ...data, posts: data.posts.map((p) => resolvePost(p, base)) };
}
export async function remoteComments(
  base: string,
  token: string | null,
  id: string,
  page = 0,
) {
  return requestJSON<{ comments: Comment[]; hasMore: boolean }>(
    base,
    `/api/community?post=${encodeURIComponent(id)}&page=${page}`,
    token,
  );
}
