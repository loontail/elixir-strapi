 Upload Flow

## ZIP archive upload

```
Admin UI                           Server                            Filesystem + DB
───────                            ──────                            ───────────────
Click "Upload ZIP"
  │
  ├─ fileInput.click()
  │  (hidden <input type="file">)
  │
  └─ uploadArchive(slug, file)     POST /builds/:slug/upload
       fetch + FormData                │
                                       ├─ Check build exists
                                       ├─ Guard: status !== 'processing'
                                       ├─ Set status = 'processing'
                                       │
                                       ├─ deleteFileEntries(buildId)  ──→ DELETE file_entries WHERE build = id
                                       ├─ deleteFilesDir(slug)        ──→ rm -rf public/bundle-registry/builds/:slug/files/
                                       ├─ ensureBuildDir(slug)        ──→ mkdir public/bundle-registry/builds/:slug/files/
                                       │
                                       ├─ extractZip(file.path, filesPath)
                                       │    ├─ Iterate ZIP entries
                                       │    ├─ Skip __MACOSX/
                                       │    ├─ Zip-slip check (isPathSafe)
                                       │    ├─ Size limit check (maxZipSize)
                                       │    └─ writeFileSync / mkdirSync
                                       │
                                       ├─ scanDirectory(filesPath)
                                       │    ├─ walkDir (recursive readdirSync)
                                       │    ├─ computeFileSha256 (streaming SHA-256)
                                       │    └─ returns ScanEntry[]
                                       │
                                       ├─ createFileEntries(buildId, scanResults)
                                       │    └─ INSERT INTO file_entries (one per file/dir)
                                       │
                                       └─ generate(slug, strapi)
                                            ├─ SELECT all file_entries for build
                                            ├─ Group by category (first path segment)
                                            ├─ Build manifest JSON
                                            ├─ writeManifestAtomic → artifacts.json.tmp → artifacts.json
                                            └─ UPDATE file_build SET status='ready', filesCount, totalSize
```

## Single file upload

```
Admin UI                        Server
───────                         ──────
AddFileModal.handleSubmit()
  │
  └─ uploadFile(slug, file,     POST /builds/:slug/files
       targetPath)                  │
       fetch + FormData             ├─ Path normalization + traversal check
                                    ├─ isPathSafe check
                                    ├─ mkdirSync (parent dirs)
                                    ├─ copyFileSync
                                    ├─ computeFileSha256
                                    ├─ Upsert file_entry (create or update by relativePath)
                                    └─ generate(slug, strapi) → rebuild manifest
```

## File operations summary

| Operation             | Physical file change        | DB change                       | Manifest regenerated |
| --------------------- | --------------------------- | ------------------------------- | -------------------- |
| Upload ZIP            | replace entire `files/` dir | replace all entries             | yes                  |
| Upload single file    | write/overwrite file        | upsert entry                    | yes                  |
| Delete file           | `unlinkSync`                | delete entry                    | yes                  |
| Delete folder         | `rmSync` recursive          | delete entry + children         | yes                  |
| Bulk delete           | `unlinkSync` per file       | deleteMany                      | yes                  |
| Rename/move           | `renameSync`                | update entry + cascade children | yes                  |
| Rehash                | none                        | update `sha256`                 | yes                  |
| Toggle `downloadOnce` | none                        | update flag                     | yes                  |
| Validate              | none                        | none                            | no                   |
| Regenerate            | none                        | update status/counts            | yes                  |
