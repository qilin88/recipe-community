# Recipe Community monorepo design

## Goal and scope
Merge the existing website and React Native application into the existing recipe-community Git repository. Use npm workspaces with apps/web and apps/mobile. Preserve website Git history, existing product behavior, mobile authorization, and GitHub-triggered Cloudflare Pages deployment. The original recipe-mobile checkout remains as a backup; do not delete it during migration.

## Repository structure
The root package is private and declares apps/web and apps/mobile workspaces. Each application owns its source, framework configuration, tests, and dependencies. One root package-lock.json records both dependency trees. Do not add empty shared packages or refactor product logic into shared modules during this migration.

Move tracked website application files into apps/web, retaining root Git metadata, repository documentation, workspace package files, ignore rules and the Pages deployment configuration. Copy current mobile source and configuration, including its AGENTS.md, into apps/mobile. Exclude nested Git metadata, node_modules, generated android/ios folders, APKs, Expo caches, local databases, credentials and local environment files. Preserve the mobile .env.example.

## Dependencies and commands
Use npm workspaces rather than introducing pnpm or Turborepo. Keep each application's existing React, TypeScript and framework versions; do not upgrade dependencies merely to consolidate them. Ensure web resolves its React/server-renderer version and mobile resolves its Expo-compatible React version. Verify actual dependency resolution and mobile bundling after installation.

Root commands provide dev:web, dev:mobile, android, ios, build:web, build:pages, preview:pages, test, lint and typecheck. Keep npm run dev and npm run build compatible with the website. Root test, lint and typecheck cover both applications. Document npm ci as the single installation entry point and application-specific environment setup.

Replace assumptions that every executable lives in an application's own node_modules directory with workspace-aware package resolution. Retain each framework's working directory and application-relative paths. Follow Expo SDK 58 monorepo guidance when configuring Metro; prefer automatic configuration over unnecessary custom resolver overrides.

## Cloudflare Pages compatibility
Keep the existing dashboard build command npm run build:pages and its dist/pages output at repository root. Build the website inside apps/web, then package its client assets and private advanced-mode Worker into root dist/pages. Update the root Wrangler migration directory to apps/web/drizzle while preserving existing D1 and R2 resource identifiers. Never add account_id to the Pages configuration.

Local Pages commands explicitly use the root deployment configuration and correct output path. Existing local runtime and database directories stay outside version control; leave the original state available as a backup. Do not run remote migrations or modify production data as part of restructuring.

## Verification and failure handling
Review the complete staged file list for secrets and generated artifacts. Verify clean dependency installation using the root lockfile, both applications' type checks, lint and existing unit tests. Build the Cloudflare Pages artifact and validate the Pages configuration. Export mobile bundles for Android, iOS and web to verify Metro resolution from its new location. Native UI acceptance remains separate because desktop computer-control tooling was unavailable in the previous task.

If dependency duplication causes invalid React resolution, fix the workspace layout or resolution configuration while preserving each application's supported versions. If build or export fails, resolve the failure before describing migration as complete. Keep the original mobile directory and Git history available for recovery.

## Alternatives considered
Leaving the website at the root and only nesting mobile would reduce path changes but produce an asymmetric layout. Switching package managers or adding a task orchestrator would add migration work without a current requirement. The selected two-app npm workspace layout provides clear boundaries and preserves existing tooling.
