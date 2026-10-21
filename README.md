# 食光 · Recipe Community

网站与 React Native App 的 npm workspaces monorepo。

```text
apps/web/       React / Vinext 网站与 Cloudflare API
apps/mobile/    Expo 58 / React Native 0.88 App
wrangler.jsonc Cloudflare Pages、D1、R2 配置
```

## 安装与启动

要求 Node.js >=22.13；完整测试建议 Node.js 24（使用内置 SQLite）。所有命令在仓库根目录执行：

```sh
npm ci
npm run dev:web       # 网站，默认 5173
npm run dev:mobile    # Expo 开发服务器
npm run android      # Android 模拟器
npm run ios          # iOS 模拟器，需要 Xcode
```

移动端在线登录需要安装 Expo 开发构建，Expo Go 不提供项目自定义登录回调。原生构建配置、EAS 命令见 [App 文档](apps/mobile/README.md)。

两端分别维护自己的 React 和 TypeScript 版本；统一的 package-lock.json 锁定依赖。添加原生模块时，在 apps/mobile 中使用 `npx expo install`，然后提交根锁文件。不要在子目录单独维护锁文件。

## 本地后端与账号

```sh
npm run build:pages
npx wrangler d1 migrations apply DB --local --persist-to .wrangler/state
npm run preview:pages
```

访问 http://127.0.0.1:8788。支持昵称、邮箱、密码直接注册，以及邮箱密码登录；游客可浏览，互动需登录。暂不提供邮箱验证和密码找回。

App 在“连接与账号”中设置 API 地址，或配置 apps/mobile/.env 中的 `EXPO_PUBLIC_API_URL`（参考该目录 .env.example）：

- Android 模拟器：`http://10.0.2.2:8788`
- iOS 模拟器：`http://127.0.0.1:8788`
- 生产后端：https://recipe-communitys.pages.dev

EXPO_PUBLIC_API_URL 为公开配置，不能包含密钥。网页 App 预览使用本地后端；原生 App 通过系统浏览器和 PKCE 授权。原 recipe-mobile 目录保留为迁移前备份；本地数据库和旧构建产物不会提交到仓库。

## 验证

```sh
npm test
npm run lint
npm run typecheck
npm run build:pages
npm run export:all --workspace @recipe/mobile
```

网站 HTTP 集成测试需要运行本地 Pages 服务，具体见 [网站文档](apps/web/README.md)。

## Cloudflare Git 自动部署

现有 Pages 项目 recipe-communitys 保持以下配置：根目录构建、生产分支 main、构建命令 `npm run build:pages`、输出目录 `dist/pages`。构建脚本将 apps/web 的产物打包到根输出目录；私有服务端代码仅放在 `_worker.js` 内。

根 wrangler.jsonc 保留 D1 的 DB 绑定、R2 的 BUCKET 绑定，迁移目录为 apps/web/drizzle。迁移仓库结构不需要修改生产数据库。只有数据库结构变更时才另行执行远程迁移。不要在 Pages 配置中加入 account_id。

迁移记录见 [设计](docs/superpowers/specs/2026-10-21-monorepo-design.md)和[实施计划](docs/superpowers/plans/2026-10-21-monorepo.md)。
