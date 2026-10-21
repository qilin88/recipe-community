# 食光 App

使用 React Native 0.88、Expo SDK 58、Expo Router 和 TypeScript，将食光网站的食谱社区做成 iOS / Android App。主要界面由原生组件实现，包含发现、关注、收藏、个人厨房、搜索、作品与完整食谱发布、评论回复、相册选择和草稿保存。

## 运行预览

要求 Node.js >=22.13：

```sh
cd /Users/chen/Desktop/recipe-community
npm ci
npm run web --workspace @recipe/mobile
```

Web 预览地址以命令输出为准，当前使用 http://localhost:8081 。Web 预览用来检查交互和布局；它不能代替原生设备验收。

```sh
npm run dev:mobile
```

使用兼容 SDK 58 的 Expo Go 可进行本机体验。首次启动没有服务器地址时默认进入本机体验身份，可以浏览、发布、关注、收藏和交流，数据只保存在当前设备。顶部持续标注模式。体验数据与在线内容、草稿分别存放；在线 API 请求失败会显示错误，不会隐式降级到体验数据。

原生系统相册、键盘、系统分享、安全存储与真实登录回跳需要在真机或原生模拟器中检查。

## 连接现有网站

在 App 的“连接与账号”页面设置 API 根地址，也可在首次运行前设置 `EXPO_PUBLIC_API_URL`。此变量是公开地址，不能放入任何令牌或密码。

- iOS 模拟器：`http://127.0.0.1:5173`
- Android 模拟器：`http://10.0.2.2:5173`
- 真机：电脑在同一 Wi-Fi 内的局域网 IP；后端需监听该地址。仅在可信开发网络开放监听。
- 已安装生产 App：使用可供 App 访问的 HTTPS 后端。

本地后端从仓库根目录启动，数据库迁移也在根目录执行：

```sh
npm run build:pages
npx wrangler d1 migrations apply DB --local --persist-to .wrangler/state
npm run preview:pages
```

Android 模拟器连接 `http://10.0.2.2:8788`；iOS 模拟器连接 `http://127.0.0.1:8788`。不要重复手工执行迁移 SQL。

原生 API 请求使用设备令牌，不伪造平台身份头。系统浏览器完成网站登录后，用户确认授权 App；S256 PKCE 校验后交换一次性代码，代码5分钟过期，设备令牌30天过期。数据库只保存哈希，原生令牌使用 SecureStore，退出时撤销会话并清除设备令牌。Web 预览令牌只存当前标签页的 sessionStorage。

Expo Go 没有注册食光的 `shiguang://auth` 回调，原生在线登录请使用开发构建。Web 预览仅允许 localhost/127.0.0.1 的8081端口回调；生产后端不会允许这些开发回调。Web预览建议使用默认8081端口。

生产后端地址：https://recipe-communitys.pages.dev。原生 App 可连接此 HTTPS 地址；网页预览应连接本地后端，以符合回调来源校验。

## 原生开发构建与安装包

已配置 bundle ID/package `com.shiguang.recipe`，正式发行前可以替换成你的标识。

以下原生构建命令在 `apps/mobile` 目录执行。具备完整 Xcode / Android SDK 时：

```sh
APP_VARIANT=development npx expo run:ios
APP_VARIANT=development npx expo run:android
```

或者使用 Expo 官方 EAS 构建流程，需你自己的 Expo 账号及相应签名权限：

```sh
npx eas-cli@latest build --platform android --profile development
npx eas-cli@latest build --platform ios --profile development
npx eas-cli@latest build --platform android --profile preview
```

`development` 配置允许本机HTTP并包含开发客户端；预览和生产构建禁止任意明文HTTP，后端应使用HTTPS。iOS 内部分发需要设备登记或开发签名，商店发行还需Apple/Google开发者账号。上述云构建和发布尚未执行，不会自动产生APK或IPA。

## 验证

以下命令在 `apps/mobile` 目录执行；依赖统一从仓库根目录安装。

```sh
npm test
npm run typecheck
npm run lint
npx expo-doctor
npm run export:all
```

`expo export --platform all` 会生成 iOS/Android Hermes JavaScript 资源包和Web静态资源，输出在 `dist/`。这些资源包不是可安装的APK/IPA。

后端检查：

```sh
cd ../..
npm run build:pages
npm run preview:pages
# 另一个终端在 apps/web 目录运行，仅针对本机测试数据库
TEST_ORIGIN=http://127.0.0.1:8788 node tests/mobile-integration.mjs
TEST_ORIGIN=http://127.0.0.1:8788 node tests/integration.mjs
```

移动认证集成测试使用独立本机测试身份，检查PKCE错误、防重放、过期、撤销、CORS和既有接口权限。测试会写入本机测试数据；不会连接生产。

## 源码

- `src/app/`：Expo Router页面、底部导航。
- `src/AppProvider.tsx`：模式与身份隔离、仓库状态、请求生命周期。
- `src/domain.ts`：本机体验数据操作、发布校验、草稿键与会话代数。
- `src/api.ts`：真实API、超时、图片地址解析。
- `src/auth.ts`、`src/storage.ts`：浏览器登录、设备令牌存储。
- `src/media.ts`：相册选择、转换压缩、图片持久化和上传。
- `src/components/`、`src/screens/`：原生卡片、通用控件与内容流。
- `../web/lib/mobile-auth.ts`：设备会话与授权码消费。

当前选图统一转JPEG，长边最多1800px，单张最多5MB；最多9张成品图。标题80字，心得5000字，食材最多50种、步骤最多30步。草稿按服务器与账号隔离。未发布的本机图片暂未配置自动清理。

参考：[Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)、[系统相册](https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/)、[安全存储](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/)、[身份回跳](https://docs.expo.dev/versions/v58.0.0/sdk/auth-session/)。
