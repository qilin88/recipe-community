# 食光 · 食谱分享社区

面向美食爱好者的响应式 Web 应用。支持美食作品和完整食谱、图片瀑布流、菜名及作者搜索、关注、点赞、收藏、评论回复和个人资料。

使用 React 19、TypeScript 和 Vinext，Cloudflare D1 存储社区数据和账户，R2 存储图片，可部署到 Cloudflare Pages（高级模式）。

## 注册与登录

- 昵称、邮箱、密码直接注册；邮箱＋密码登录，支持退出。
- 注册后可直接登录，不发送验证邮件，暂不提供密码找回。
- 邮箱会去除两端空格并转为小写；同一邮箱不能重复注册。
- 密码为 12–128 个字符，服务端使用独立随机盐的 PBKDF2-SHA256（100,000 次，适配 Workerd）保存密码派生值。
- 网站会话有效期 7 天，使用 HttpOnly、SameSite=Lax Cookie，HTTPS 下启用 Secure。数据库仅存会话令牌哈希。退出立即撤销当前会话。
- 游客可以浏览，发布、点赞、收藏、关注、评论和修改资料需要登录。服务端拒绝外部传入的原 Sites 身份头。
- 登录与注册有邮箱及 IP 频率限制；认证 POST 要求同源 JSON 请求。
- 移动端仍使用浏览器登录＋PKCE 一次性授权码，设备令牌有效期 30 天。旧的模拟身份和旧设备会话不能直接用于新邮箱账号。

## 本地运行

以下命令在仓库根目录执行。要求 Node.js >=22.13；测试使用 Node.js 24 的内置 SQLite。

```sh
npm ci
npm run build:pages
npx wrangler d1 migrations apply DB --local --persist-to .wrangler/state
npm run preview:pages
```

打开 http://127.0.0.1:8788 。开发热更新使用 `npm run dev`，默认 5173 端口。开发与生产都使用真实的本机邮箱账号注册流程，没有默认 Seedy 登录。

已有旧版本地数据库若此前手工执行过 0000/0001 而没有迁移记录，只对该旧数据库执行一次 `npx wrangler d1 execute DB --local --persist-to .wrangler/state --file apps/web/drizzle/0002_email_auth.sql`，不要重复应用已有表。线上新建数据库应使用完整迁移。

## 验证

```sh
npm test
npm run typecheck
npm run build:pages
```

保持本地 Pages 预览运行，再执行：

```sh
TEST_ORIGIN=http://127.0.0.1:8788 node apps/web/tests/auth-integration.mjs
TEST_ORIGIN=http://127.0.0.1:8788 node apps/web/tests/integration.mjs
cd apps/web
TEST_ORIGIN=http://127.0.0.1:8788 node tests/mobile-integration.mjs
```

集成测试只允许 loopback 地址，会注册测试账号并测试本地 D1/R2。社区测试会清理其发布和图片，测试账号保留在本地数据库；不能指向生产环境。

## Cloudflare Pages 部署

`wrangler.jsonc` 是 Pages 配置；`apps/web/wrangler.worker.jsonc` 仅供 Vite 构建 Worker 使用。部署前：

1. 在自己的 Cloudflare 账号创建 D1 数据库 `recipe-community-db`，将真实 `database_id` 写入 `wrangler.jsonc`。
2. 创建 R2 存储桶 `recipe-community-images`；确认绑定名为 `BUCKET`。R2 若未开通，需要在 Cloudflare 自行确认订阅/支付条件。
3. 使用现有 Pages 项目 `recipe-communitys`；设置 D1 绑定 `DB`、R2 绑定 `BUCKET`、兼容标志 `nodejs_compat`。
4. 执行远程迁移，再构建部署：

```sh
npx wrangler login
npx wrangler d1 migrations apply DB --remote
npm run build:pages
npm run deploy:pages
```

如果通过 Pages 的 Git 集成部署：生产分支 `main`，构建命令 `npm run build:pages`，输出目录 `dist/pages`，Node.js 版本至少 22.13。D1 迁移需在首次发布前完成。

`dist/pages/_worker.js/` 是私有服务端模块目录；请勿将 `dist/server` 作为静态站点目录上传。打包脚本会清除 Vite 生成的 Wrangler 配置重定向，让 Pages 使用正确的配置。

仓库不包含密钥、本地账号数据库、node_modules、构建产物。当前真实云端部署是否完成应以实际部署记录为准，不能以本地构建成功代替。

## 范围与限制

图片最多 9 张，每张最多 5MB，支持 JPG/PNG/WebP，服务端检查文件签名及上传归属。食谱需要食材用量与文字步骤。支持删除自己的发布与评论；未发布的网页表单不持久保存。暂不包含私信、视频、内容编辑、推荐算法和找回密码。

首页带“灵感示例”标识的内容为示例，图片来自 Unsplash，不伪装真实投稿，不能互动。用户发布后显示真实社区内容。账号使用的邮箱未经验证，不代表已确认邮箱所有权。
