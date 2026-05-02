 strapi-plugin-bundle-registry

A Strapi v4 plugin for managing Minecraft build file sets. Upload ZIP archives, track individual files with SHA-256 hashes, and serve a JSON manifest that a launcher client can consume to download the correct file set.

---

## Description

The plugin provides:

- **Build management** — create named builds, each with a slug, version, and status.
- **File ingestion** — upload a ZIP archive; files are extracted, hashed, and stored on disk.
- **Manifest generation** — produces `artifacts.json` grouped by top-level directory with download URLs, hashes, and sizes.
- **Custom field** — a `build-picker` field type you can attach to any Content-Type to link a build to a CMS entry.
- **Lifecycle hook** — automatically sets the `metadataUrl` on a linked `api::client.client` record when a build is assigned.

---

## Installation

```bash
# inside your Strapi project
cp -r strapi-plugin-bundle-registry src/plugins/bundle-registry
```

Add to `config/plugins.js` (or `config/plugins.ts`):

```js
module.exports = {
  'bundle-registry': {
    enabled: true,
    resolve: './src/plugins/bundle-registry',
  },
};
```

Restart Strapi — the plugin registers its content-types, routes, and admin panel entry automatically.

---

## Configuration

All options live in `config/plugins.js` under the plugin key:

| Option          | Type     | Default               | Description                                                                 |
| --------------- | -------- | --------------------- | --------------------------------------------------------------------------- |
| `publicUrl`     | `string` | `''`                  | Override the base URL used in manifest file URLs. Defaults to `server.url`. |
| `maxZipSize`    | `number` | `10737418240` (10 GB) | Maximum total uncompressed size of an uploaded ZIP.                         |
| `maxZipEntries` | `number` | `100000`              | Maximum number of entries in an uploaded ZIP.                               |

Example:

```js
module.exports = {
  'bundle-registry': {
    enabled: true,
    resolve: './src/plugins/bundle-registry',
    config: {
      publicUrl: 'https://cdn.example.com',
      maxZipSize: 5 * 1024 * 1024 * 1024, // 5 GB
    },
  },
};
```

---

## API

All admin routes require Strapi admin authentication. The manifest endpoint is public.

### Admin routes (`/bundle-registry/builds/…`)

| Method   | Path                                  | Handler                    | Description                                         |
| -------- | ------------------------------------- | -------------------------- | --------------------------------------------------- |
| `GET`    | `/builds`                             | `build.find`               | List all builds                                     |
| `POST`   | `/builds`                             | `build.create`             | Create a build                                      |
| `GET`    | `/builds/:slug`                       | `build.findOne`            | Get a build with its file entries                   |
| `PUT`    | `/builds/:slug`                       | `build.update`             | Update name/description/version                     |
| `DELETE` | `/builds/:slug`                       | `build.delete`             | Delete build + all files                            |
| `POST`   | `/builds/:slug/upload`                | `build.uploadArchive`      | Upload a ZIP (field: `archive`)                     |
| `POST`   | `/builds/:slug/files`                 | `build.uploadFile`         | Upload a single file (fields: `file`, `targetPath`) |
| `DELETE` | `/builds/:slug/files/:entryId`        | `build.deleteFile`         | Delete a file or folder                             |
| `PUT`    | `/builds/:slug/files/:entryId`        | `build.updateFile`         | Toggle `downloadOnce`                               |
| `PATCH`  | `/builds/:slug/files/:entryId`        | `build.renameFile`         | Rename/move a file or folder                        |
| `POST`   | `/builds/:slug/files/:entryId/rehash` | `build.rehashFile`         | Recompute SHA-256                                   |
| `POST`   | `/builds/:slug/files/bulk-delete`     | `build.bulkDeleteFiles`    | Delete multiple files by ID array                   |
| `POST`   | `/builds/:slug/validate`              | `build.validate`           | Compare DB entries vs disk                          |
| `POST`   | `/builds/:slug/regenerate`            | `build.regenerateManifest` | Rebuild `artifacts.json`                            |

### Content API (public)

| Method | Path                                      | Description                                 |
| ------ | ----------------------------------------- | ------------------------------------------- |
| `GET`  | `/api/bundle-registry/builds/:slug/manifest` | Serve the build's `artifacts.json` manifest |

#### Example manifest response

```json
{
  "mods": [
    {
      "path": "mods/create-1.0.0.jar",
      "name": "create-1.0.0.jar",
      "size": 2097152,
      "isDir": false,
      "sha256": "a1b2c3…",
      "url": "http://localhost:1337/bundle-registry/builds/my-pack/files/mods/create-1.0.0.jar"
    }
  ],
  "config": [...]
}
```

---

## Admin UI

### Build List (`/admin/plugins/bundle-registry`)

Table of all builds showing name, slug, version, status badge, file count, and total size. Click a row to open the build detail. Delete button per row with confirmation dialog.

### Create Build (`/admin/plugins/bundle-registry/new`)

Form with Name (required), Slug (auto-generated from name, required), Version (optional), Description (optional).

### Build Detail (`/admin/plugins/bundle-registry/:slug`)

Full file manager with:

- **Toolbar** — Validate, Regenerate, Add file, Upload ZIP buttons.
- **Stats bar** — status badge, file count, total size, last generated timestamp.
- **Manifest URL panel** — visible when status is `ready`, one-click copy.
- **File tree table** — VS Code-style expandable tree with checkboxes, search/filter, SHA-256 (copyable), download-once toggle, and per-row context menu (Rename, Replace, Regenerate hash, Delete).
- **Bulk delete** — select multiple files via checkboxes, then "Delete N" button.
- **Validation results** — "Remove missing" button appears if validate finds missing entries.

---

## Development

```bash
# install plugin dependencies first (required — ts-node is used to load the server at runtime)
cd src/plugins/bundle-registry
npm install
cd ../../..

# start Strapi (from project root)
npm run develop

# type check (inside plugin directory)
cd src/plugins/bundle-registry
npm run typecheck

# lint
npm run lint
npm run lint:fix

# format
npm run format
npm run format:check

# build (from Strapi project root)
npm run build
npm run develop
```

---

## Architecture

```
bundle-registry/
├── admin/src/              # Admin panel (React + TypeScript)
│   ├── api/builds.ts       # HTTP client (wraps Strapi's request helper + fetch for multipart)
│   ├── components/         # Shared UI components
│   │   ├── Icons/          # Custom SVG icon components
│   │   ├── StatusBadge/    # Coloured status pill
│   │   └── BuildPickerInput/ # Custom field input for Content-Type Builder
│   ├── pages/
│   │   ├── BuildListPage/  # Build table view
│   │   ├── BuildCreatePage/ # Create form
│   │   └── BuildDetailPage/ # File manager (split into hooks + sub-components)
│   │       ├── hooks/      # useBuildDetail, useFileTree, useFileOperations
│   │       └── components/ # Toolbar, StatsBar, FileTreeTable, FileTreeRow, modals
│   ├── translations/en.json # All UI strings
│   └── utils/              # formatBytes, getTranslation
│
├── server/                 # Strapi server (Node.js + TypeScript)
│   ├── controllers/        # build.ts (14 handlers), manifest.ts
│   ├── services/           # build.ts, storage.ts, scanner.ts, archive.ts, manifest-generator.ts
│   ├── routes/             # admin.routes.ts, content.routes.ts
│   └── content-types/      # file-build, file-entry schemas (JSON)
│
└── shared/                 # Types and constants shared by admin ↔ server
    ├── types/entities.ts   # Build, FileEntry, BuildStatus
    ├── types/api.ts        # DTO types (CreateBuildDto, ValidateResult, Manifest, …)
    └── constants/          # PERMISSIONS, ADMIN_ROUTES
```

**Data flow:**

1. Admin uploads ZIP → `uploadArchive` controller.
2. `archive.extractZip` extracts files to `public/bundle-registry/builds/:slug/files/`.
3. `scanner.scanDirectory` walks the directory, computes SHA-256 for each file.
4. File entries are saved to DB (`plugin::bundle-registry.file-entry`).
5. `manifest-generator.generate` groups entries by category, writes `artifacts.json`.
6. Launcher fetches the manifest via the public content-API endpoint.
