# minecraft-versions

A Strapi v5 plugin that fetches and caches version catalogs for Minecraft, Forge, Fabric, and the Mojang Java runtime, exposes them through public content-API routes, and registers four custom fields (`SingleSelect` pickers) backed by those routes. Sources are fetched directly from official upstream catalogs (`piston-meta.mojang.com`, `files.minecraftforge.net`, `meta.fabricmc.net`, `launchermeta.mojang.com`) using only Node built-ins — there are no `@xmcl/*` or `minecraft-launcher-core-node` dependencies.

## Routes

All routes are public (`auth: false`) and mounted at `/api/minecraft-versions/...`.

### `GET /api/minecraft-versions/minecraft`

Query params:

- `type` (optional) — `release` (default) returns release versions only; `all` returns the full manifest including snapshots and old betas/alphas.

Response:

```json
{
  "versions": [
    { "id": "1.21.4", "type": "release", "releaseTime": "2024-12-03T08:25:34+00:00" }
  ]
}
```

Sorted newest-first by `releaseTime`.

### `GET /api/minecraft-versions/forge`

Query params:

- `minecraft` (required) — A Minecraft version id like `1.20.1`. Without it the route returns an empty list.

Response:

```json
{ "versions": ["47.2.0", "47.1.46", "..."] }
```

Sorted newest-first using a numeric-component compare. Empty if Forge has no versions for the requested Minecraft version.

### `GET /api/minecraft-versions/fabric`

No query params.

Response:

```json
{
  "loaderVersions": [{ "version": "0.16.10", "stable": true }],
  "gameVersions": ["1.21.4", "1.21.3", "..."]
}
```

`gameVersions` reflects the Minecraft versions Fabric currently supports (loaders are version-agnostic but the game version must be supported by Fabric).

### `GET /api/minecraft-versions/runtime`

No query params.

Response:

```json
{
  "runtimes": [
    { "component": "java-runtime-gamma", "version": "21.0.3" },
    { "component": "jre-legacy", "version": "8u202" }
  ]
}
```

`version` is the `version.name` reported by Mojang for the Strapi process's current OS/arch (auto-detected from `process.platform` and `process.arch`). If the component is not available on the current OS/arch the `version` field is an empty string — the component name is still listed so admins can choose it for any platform.

## Custom fields

All four are stored as `string` and registered for use in the Content-Type Builder:

- `plugin::minecraft-versions.minecraft-version-picker`
- `plugin::minecraft-versions.forge-version-picker` (cascading; reads sibling `minecraftVersion`)
- `plugin::minecraft-versions.fabric-version-picker` (cascading; reads sibling `minecraftVersion`)
- `plugin::minecraft-versions.runtime-version-picker`

The Forge and Fabric pickers are disabled with the placeholder "Select Minecraft version first" until a `minecraftVersion` value is present on the same entry. They look up the current edited entry's `minecraftVersion` via the unstable Content-Manager context (`unstable_useContentManagerContext` from `@strapi/content-manager/strapi-admin`).

## Cache behaviour

- TTL is 1 hour.
- Two-tier cache: in-memory map (process-local) plus on-disk JSON files at `<strapi-root>/.tmp/minecraft-versions/<key>.json`.
- Disk writes are atomic: the new value is written to `<file>.tmp` first, then renamed.
- On a cache miss or expired entry the upstream is fetched. If the upstream fetch fails *and* a stale value exists, the stale value is served instead. If no cached value exists, the route responds with `502` and `{ error: { code: "UPSTREAM_FETCH_FAILED", message, details: { url } } }`.

## Manual data migration

The previous `Minecraft` content type (`api::minecraft.minecraft`) and the relation `Client.minecraftVersion -> api::minecraft.minecraft` are gone. After updating, the Strapi DB column for the relation is orphaned — no migration runs automatically and that is fine for development. Developers must:

1. Open every existing Client entry in the admin UI (every locale).
2. Set `minecraftVersion` to a Minecraft version id (e.g. `1.20.1`) corresponding to whatever was set by the deleted `Minecraft` content type for that client.
3. Optionally set `forgeVersion`, `fabricVersion`, and `runtimeVersion` to match the loader/runtime previously implied by that record.
4. Save and re-publish.

The launcher consumes `minecraftVersion`, `forgeVersion`, `fabricVersion`, and `runtimeVersion` directly as plain strings — no relation traversal needed.

In addition, the old `minecraft-pack*` and `java-runtime-*` builds in `bundle-registry` should be deleted from the Bundle Registry admin UI: the launcher no longer downloads Minecraft game files or JREs through `bundle-registry`. `bundle-registry` is now intended only for mods, configs, resourcepacks, shaderpacks, and overrides.
