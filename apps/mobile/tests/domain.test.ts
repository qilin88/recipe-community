import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  mutateDemo,
  selectDemo,
  validateDraft,
  validateApiUrl,
} from "../src/domain.ts";
const draft = {
  type: "work",
  title: "测试菜",
  body: "香喷喷",
  images: ["file:///test.jpg"],
  ingredients: [],
  steps: [],
  servings: "2 人份",
  tag: "家常",
};
test("作品和食谱发布要求不同，文字必须有效", () => {
  assert.throws(() => validateDraft({ ...draft, title: " " }));
  assert.throws(() => validateDraft({ ...draft, images: [] }));
  assert.throws(() => validateDraft({ ...draft, type: "recipe" }));
  assert.doesNotThrow(() =>
    validateDraft({
      ...draft,
      type: "recipe",
      ingredients: [{ name: "蛋", amount: "2个" }],
      steps: [{ text: "炒熟" }],
    }),
  );
});
test("本机内容发布后可搜索并隔离收藏", () => {
  let state = initialState();
  state = mutateDemo(state, { action: "publish", ...draft }, "new");
  assert.equal(selectDemo(state, { q: "测试菜" }).posts.length, 1);
  assert.equal(selectDemo(state, { feed: "saved" }).posts.length, 0);
  state = mutateDemo(state, { action: "save", postId: "new", active: true });
  state = mutateDemo(state, { action: "save", postId: "new", active: true });
  assert.equal(selectDemo(state, { feed: "saved" }).posts.length, 1);
});
test("点赞幂等、取消与类型筛选", () => {
  let s = initialState();
  const p = s.posts[0];
  s = mutateDemo(s, { action: "like", postId: p.id, active: true });
  s = mutateDemo(s, { action: "like", postId: p.id, active: true });
  assert.equal(selectDemo(s, {}).posts.find((x) => x.id === p.id)?.likes, 1);
  s = mutateDemo(s, { action: "like", postId: p.id, active: false });
  assert.equal(selectDemo(s, {}).posts.find((x) => x.id === p.id)?.likes, 0);
  assert.ok(
    selectDemo(s, { type: "recipe" }).posts.every((x) => x.type === "recipe"),
  );
});
test("关注流与取消关注", () => {
  let s = initialState(),
    author = s.posts[0].authorId;
  s = mutateDemo(s, { action: "follow", authorId: author, active: true });
  assert.ok(selectDemo(s, { feed: "following" }).posts.length > 0);
  assert.ok(
    selectDemo(s, { feed: "following" }).posts.every(
      (x) => x.authorId === author,
    ),
  );
  s = mutateDemo(s, { action: "follow", authorId: author, active: false });
  assert.equal(selectDemo(s, { feed: "following" }).posts.length, 0);
});
test("评论只能回复同一内容，不允许匿名写入", () => {
  let s = initialState();
  const id = s.posts[0].id;
  s = mutateDemo(s, { action: "comment", postId: id, text: "好吃" }, "comment");
  assert.throws(() =>
    mutateDemo(s, {
      action: "comment",
      postId: s.posts[1].id,
      text: "错位",
      parentId: "comment",
    }),
  );
  s = mutateDemo(
    s,
    { action: "comment", postId: id, text: "谢谢", parentId: "comment" },
    "reply",
  );
  assert.equal(s.comments.length, 2);
  assert.throws(() =>
    mutateDemo(
      { ...s, signedIn: false },
      { action: "like", postId: id, active: true },
    ),
  );
});
test("API配置不能把任意HTTP或凭据作为正式后端", () => {
  assert.equal(validateApiUrl("https://food.example/"), "https://food.example");
  assert.equal(
    validateApiUrl("http://192.168.1.2:5173", true),
    "http://192.168.1.2:5173",
  );
  assert.throws(() => validateApiUrl("http://food.example"));
  assert.throws(() => validateApiUrl("https://user:pass@food.example"));
  assert.throws(() => validateApiUrl("javascript:alert(1)"));
});

test("草稿按服务器和用户隔离", async () => {
  const { draftStorageKey } = await import("../src/domain.ts");
  assert.notEqual(
    draftStorageKey("https://a.example", "a"),
    draftStorageKey("https://a.example", "b"),
  );
  assert.notEqual(
    draftStorageKey("https://a.example", "a"),
    draftStorageKey("https://b.example", "a"),
  );
});
test("账号或连接变更后拒绝旧请求结果", async () => {
  const { SessionGate } = await import("../src/domain.ts");
  const gate = new SessionGate(),
    before = gate.current();
  gate.advance();
  assert.equal(gate.accepts(before), false);
  assert.equal(gate.accepts(gate.current()), true);
});
