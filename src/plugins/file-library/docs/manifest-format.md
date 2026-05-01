# Manifest Format (`artifacts.json`)

The manifest is written to `public/file-library/builds/:slug/artifacts.json` and served at the public API endpoint:

```
GET /api/file-library/builds/:slug/manifest
```

## Structure

The manifest is a JSON object where each key is a **category** (the first path segment of the files in that group, or `"root"` for top-level files).

```ts
type Manifest = Record<string, ManifestEntry[]>;

interface ManifestEntry {
  path: string; // relative path from build root, e.g. "mods/create-1.0.0.jar"
  name: string; // filename or dirname
  size: number; // bytes (0 for directories)
  isDir: boolean; // true if this entry is a directory
  sha256?: string; // SHA-256 hex hash (files only)
  url?: string; // absolute download URL (files only)
  downloadOnce?: true; // present and true if the launcher should delete after use
}
```

## Example

Given this build file structure:

```
files/
  mods/
    create-1.0.0.jar
    jei-10.0.0.jar
  config/
    settings.json
  README.txt
```

The manifest would be:

```json
{
  "mods": [
    {
      "path": "mods",
      "name": "mods",
      "size": 0,
      "isDir": true
    },
    {
      "path": "mods/create-1.0.0.jar",
      "name": "create-1.0.0.jar",
      "size": 2097152,
      "isDir": false,
      "sha256": "a1b2c3d4e5f6...",
      "url": "http://localhost:1337/file-library/builds/my-pack/files/mods/create-1.0.0.jar"
    },
    {
      "path": "mods/jei-10.0.0.jar",
      "name": "jei-10.0.0.jar",
      "size": 1048576,
      "isDir": false,
      "sha256": "b2c3d4e5f6a1...",
      "url": "http://localhost:1337/file-library/builds/my-pack/files/mods/jei-10.0.0.jar"
    }
  ],
  "config": [
    {
      "path": "config",
      "name": "config",
      "size": 0,
      "isDir": true
    },
    {
      "path": "config/settings.json",
      "name": "settings.json",
      "size": 512,
      "isDir": false,
      "sha256": "c3d4e5f6a1b2...",
      "url": "http://localhost:1337/file-library/builds/my-pack/files/config/settings.json"
    }
  ],
  "root": [
    {
      "path": "README.txt",
      "name": "README.txt",
      "size": 256,
      "isDir": false,
      "sha256": "d4e5f6a1b2c3...",
      "url": "http://localhost:1337/file-library/builds/my-pack/files/README.txt"
    }
  ]
}
```

## `downloadOnce` flag

When a file entry has `downloadOnce: true`, the manifest includes it:

```json
{
  "path": "patches/hotfix.jar",
  "name": "hotfix.jar",
  "size": 65536,
  "isDir": false,
  "sha256": "...",
  "url": "...",
  "downloadOnce": true
}
```

The launcher is expected to delete the file from the client's local storage after it has been applied once.

## Atomic writes

The manifest is written atomically: first to `artifacts.json.tmp`, then renamed to `artifacts.json`. This prevents a launcher from reading a partially-written file during regeneration.
