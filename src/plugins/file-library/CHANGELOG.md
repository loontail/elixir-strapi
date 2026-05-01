# Changelog

All notable changes to `strapi-plugin-file-library` are documented here.

## [Unreleased] — Structural Refactor

### Summary

Comprehensive structural refactor — no behaviour changes. All API contracts, routes, schemas, and business logic are identical to `0.1.0`.

### Added

- **TypeScript** — full migration of `admin/` and `server/` to `.ts` / `.tsx`. Strict mode enabled (`strict: true`, `noImplicitAny: true`).
- **ESLint** — configured with `@typescript-eslint/recommended`, `react/recommended`, `react-hooks/recommended`, `import/recommended`. Rule `react-hooks/exhaustive-deps` is an error.
- **Prettier** — `singleQuote: true`, `trailingComma: all`, `printWidth: 100`.
- **`package.json` scripts** — `lint`, `lint:fix`, `format`, `format:check`, `typecheck`.
- **`tsconfig.json`** — project references for `admin/` and `server/`.
- **Shared types** (`shared/types/`) — `Build`, `FileEntry`, `BuildStatus`, `Manifest`, DTO types shared between admin and server. Single source of truth for all domain entities.
- **Custom icons** (`admin/src/components/icons/`) — each icon is now its own `.tsx` file with typed `IconProps`. Barrel export via `index.ts`.
- **Translations** — `admin/src/translations/en.json` expanded from 3 keys to full coverage (all UI strings, modal labels, toast messages, table headers).
- **`getTranslation` helper** (`admin/src/utils/getTranslation.ts`) — prefixes translation IDs with `file-library.`.
- **`formatBytes` utility** (`admin/src/utils/formatBytes.ts`) — extracted from inline duplication in `BuildListPage` and `BuildDetailPage`.
- **`README.md`** — full documentation: description, installation, configuration, API reference, Admin UI guide, development commands, architecture diagram.
- **`docs/`** — detailed flow documents for upload, manifest format, and permissions.

### Changed

- `BuildDetailPage` (was 985 lines) split into:
  - `hooks/useBuildDetail.ts` — data fetching and loading state.
  - `hooks/useFileTree.ts` — tree building, flattening, expand/select state.
  - `hooks/useFileOperations.ts` — all mutation handlers (upload, delete, rename, rehash, validate, regenerate).
  - `components/Toolbar/` — action buttons strip.
  - `components/StatsBar/` — status, file count, size, last-generated stats.
  - `components/FileTreeTable/` — table shell with header row.
  - `components/FileTreeRow/` — single memoized row (file or directory).
  - `components/AddFileModal/`, `RenameModal/`, `DeleteFileDialog/`, `BulkDeleteDialog/` — extracted modal components.
- All components use named imports from `react` (no `import React from 'react'`).
- All list/table row components wrapped with `memo`; callbacks passed as props use `useCallback`.
- Arrow functions used consistently for all component and utility definitions.

### Removed

- All `PropTypes` validation (replaced by TypeScript types).
- Duplicate `formatBytes` function (was defined twice: in `BuildListPage` and `BuildDetailPage`).
- Old `admin/src/components/Icons/index.js` (replaced by `admin/src/components/icons/` directory).

---

## [0.1.0] — Initial Release

- Build management CRUD (create, list, detail, delete).
- ZIP upload with extraction, SHA-256 scanning, and manifest generation.
- Single-file upload and replace.
- Rename/move, rehash, delete, bulk-delete file entries.
- Validate endpoint (missing vs. orphaned files).
- `build-picker` custom field for Content-Type Builder.
- Lifecycle hook: auto-sets `metadataUrl` on linked `api::client.client`.
- Public content-API manifest endpoint.
