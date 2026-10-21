import { examples, exampleCreators } from "./examples.ts";
import type {
  Post,
  Profile,
  Comment,
  Ingredient,
  Step,
  FeedData,
} from "./types.ts";
export type Draft = {
  type: "work" | "recipe";
  title: string;
  body: string;
  images: string[];
  ingredients: Ingredient[];
  steps: Step[];
  servings: string;
  tag: string;
};
export type Query = {
  feed?: string;
  q?: string;
  author?: string;
  detail?: string;
  type?: string;
  page?: number;
};
export type DemoState = {
  version: 1;
  signedIn: boolean;
  profiles: Profile[];
  posts: Post[];
  comments: Comment[];
  likes: string[];
  saved: string[];
  following: string[];
};
export const localUser = "local-chef";
export function initialState(): DemoState {
  return {
    version: 1,
    signedIn: true,
    profiles: [
      {
        id: localUser,
        name: "我的小厨房",
        bio: "把每一餐，做成喜欢的样子。",
        avatar: "",
        followers: 0,
        following: 0,
        followed: false,
      },
      ...exampleCreators,
    ],
    posts: examples.map((p, i) => ({
      ...p,
      createdAt: Date.now() - i * 3600000,
    })),
    comments: [],
    likes: [],
    saved: [],
    following: [],
  };
}
function text(value: unknown, max: number, required = false) {
  if (typeof value !== "string") throw new Error("请填写有效文字");
  const s = value.trim();
  if (required && !s) throw new Error("请完成必填内容");
  if (s.length > max) throw new Error(`文字不能超过${max}字`);
  return s;
}
export function validateDraft(value: unknown): Draft {
  if (!value || typeof value !== "object") throw new Error("内容无效");
  const v = value as Draft;
  if (v.type !== "recipe" && v.type !== "work")
    throw new Error("请选择内容类型");
  const title = text(v.title, 80, true),
    body = text(v.body || "", 5000),
    tag = text(v.tag || "", 20),
    servings = text(v.servings || "", 30);
  if (
    !Array.isArray(v.images) ||
    !v.images.length ||
    v.images.length > 9 ||
    v.images.some((i) => typeof i !== "string" || !i)
  )
    throw new Error("请添加1–9张成品图");
  let ingredients: Ingredient[] = [],
    steps: Step[] = [];
  if (v.type === "recipe") {
    if (
      !Array.isArray(v.ingredients) ||
      !v.ingredients.length ||
      v.ingredients.length > 50
    )
      throw new Error("请填写1–50种食材");
    ingredients = v.ingredients.map((i) => ({
      name: text(i?.name, 80, true),
      amount: text(i?.amount, 80, true),
    }));
    if (!Array.isArray(v.steps) || !v.steps.length || v.steps.length > 30)
      throw new Error("请填写1–30个步骤");
    steps = v.steps.map((s) => ({
      text: text(s?.text, 2000, true),
      ...(s.image ? { image: s.image } : {}),
    }));
  }
  return {
    type: v.type,
    title,
    body,
    tag,
    servings,
    images: [...v.images],
    ingredients,
    steps,
  };
}
export function validateApiUrl(value: string, development = false) {
  const url = new URL(value.trim());
  const host = url.hostname;
  const local =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "10.0.2.2" ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (url.protocol !== "https:" &&
      !(development && url.protocol === "http:" && local))
  )
    throw new Error("请输入HTTPS服务地址；开发时可用本机或局域网HTTP地址");
  return url.origin;
}
export function selectDemo(s: DemoState, q: Query): FeedData {
  const viewer = s.signedIn ? localUser : "";
  const profile = (p: Profile): Profile => ({
    ...p,
    following: p.id === localUser ? s.following.length : 0,
    followers: p.id !== localUser && s.following.includes(p.id) ? 1 : 0,
    followed: !!viewer && s.following.includes(p.id),
  });
  const query = (q.q || "").toLowerCase(),
    page = q.page || 0;
  const posts = s.posts
    .filter(
      (p) =>
        (!q.detail || p.id === q.detail) &&
        (!q.author || p.authorId === q.author) &&
        (!q.type || q.type === "all" || p.type === q.type) &&
        (!query ||
          p.title.toLowerCase().includes(query) ||
          (s.profiles.find((a) => a.id === p.authorId)?.name || "")
            .toLowerCase()
            .includes(query)) &&
        (q.feed !== "saved" || (!!viewer && s.saved.includes(p.id))) &&
        (q.feed !== "following" ||
          (!!viewer && s.following.includes(p.authorId))),
    )
    .sort((a, b) => b.createdAt - a.createdAt);
  return {
    me: viewer ? profile(s.profiles.find((p) => p.id === localUser)!) : null,
    profile: q.author
      ? profile(
          s.profiles.find((p) => p.id === q.author) || {
            id: q.author,
            name: "未知作者",
            bio: "",
            avatar: "",
            followers: 0,
            following: 0,
            followed: false,
          },
        )
      : null,
    creators: s.profiles
      .filter(
        (p) =>
          p.id !== localUser &&
          (!query || p.name.toLowerCase().includes(query)),
      )
      .map(profile),
    hasMore: posts.length > (page + 1) * 24,
    posts: posts
      .slice(page * 24, (page + 1) * 24)
      .map((p) => ({
        ...p,
        name: s.profiles.find((a) => a.id === p.authorId)?.name || p.name,
        liked: !!viewer && s.likes.includes(p.id),
        saved: !!viewer && s.saved.includes(p.id),
        followed: !!viewer && s.following.includes(p.authorId),
        likes: s.likes.includes(p.id) ? 1 : 0,
        favorites: s.saved.includes(p.id) ? 1 : 0,
        commentCount: s.comments.filter((c) => c.postId === p.id).length,
      })),
  };
}
export function mutateDemo(
  state: DemoState,
  input: Record<string, unknown>,
  id = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
): DemoState {
  if (!state.signedIn) throw new Error("请先进入体验身份");
  const s = JSON.parse(JSON.stringify(state)) as DemoState,
    action = input.action,
    me = s.profiles.find((p) => p.id === localUser)!;
  if (action === "publish") {
    const d = validateDraft(input);
    s.posts.unshift({
      ...d,
      id,
      authorId: localUser,
      name: me.name,
      avatar: "",
      createdAt: Date.now(),
      likes: 0,
      favorites: 0,
      commentCount: 0,
      liked: false,
      saved: false,
      followed: false,
      demo: true,
    });
    return s;
  }
  if (action === "profile") {
    me.name = text(input.name, 40, true);
    me.bio = text(input.bio || "", 200);
    return s;
  }
  if (action === "follow") {
    const author = String(input.authorId);
    if (author === localUser || !s.profiles.some((p) => p.id === author))
      throw new Error("无法关注该作者");
    s.following = input.active
      ? [...new Set([...s.following, author])]
      : s.following.filter((i) => i !== author);
    return s;
  }
  if (action === "deleteComment") {
    const c = s.comments.find((c) => c.id === input.id);
    if (!c || c.authorId !== localUser) throw new Error("只能删除自己的评论");
    s.comments = s.comments
      .filter((c) => c.id !== input.id)
      .map((c) => (c.parentId === input.id ? { ...c, parentId: null } : c));
    return s;
  }
  const p = s.posts.find((p) => p.id === input.postId);
  if (!p) throw new Error("内容不存在");
  if (action === "like" || action === "save") {
    const key = action === "like" ? "likes" : "saved";
    s[key] = input.active
      ? [...new Set([...s[key], p.id])]
      : s[key].filter((i) => i !== p.id);
    return s;
  }
  if (action === "comment") {
    const body = text(input.text, 1000, true),
      parentId = input.parentId ? String(input.parentId) : null;
    if (
      parentId &&
      !s.comments.some((c) => c.id === parentId && c.postId === p.id)
    )
      throw new Error("回复的评论不属于该内容");
    s.comments.push({
      id,
      postId: p.id,
      authorId: localUser,
      name: me.name,
      text: body,
      parentId,
      createdAt: Date.now(),
    });
    return s;
  }
  if (action === "delete") {
    if (p.authorId !== localUser) throw new Error("只能删除自己的内容");
    s.posts = s.posts.filter((x) => x.id !== p.id);
    s.comments = s.comments.filter((c) => c.postId !== p.id);
    s.likes = s.likes.filter((i) => i !== p.id);
    s.saved = s.saved.filter((i) => i !== p.id);
    return s;
  }
  throw new Error("不支持的操作");
}
export function draftStorageKey(base: string, userId: string) {
  return (
    "shiguang.draft.v2." +
    encodeURIComponent(base || "demo") +
    "." +
    encodeURIComponent(userId)
  );
}
export class SessionGate {
  private generation = 0;
  current() {
    return this.generation;
  }
  advance() {
    this.generation++;
    return this.generation;
  }
  accepts(generation: number) {
    return this.generation === generation;
  }
}
