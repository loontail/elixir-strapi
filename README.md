# 🚀 Getting started with Strapi

## Running

```
npm run dev    # `strapi develop` on http://localhost:2052
```

Port `2052` is one of Cloudflare's HTTPS-proxied ports: in production
this Strapi sits behind a Cloudflare tunnel (or origin rule) that
terminates TLS at the edge and forwards plain HTTP to `:2052` locally.
No in-repo SSL / mkcert / `local-ssl-proxy` plumbing — the dev server
binds to plain HTTP and any HTTPS-fronting belongs at the edge.

The launcher (`minecraft-launcher`) points at this Strapi via its own
`API_URL` env. For purely local dev that's `http://localhost:2052`;
when exercising the Cloudflare path, set it to the public Cloudflare
hostname instead.

## Recent changes

- New `minecraft-versions` plugin (`src/plugins/minecraft-versions/`) — fetches and caches Minecraft / Forge / Fabric / Java-runtime version catalogs from official upstream sources and registers four custom fields backed by public content-API routes (`/api/minecraft-versions/{minecraft,forge,fabric,runtime}`).
- The `Minecraft` content type has been removed (`src/api/minecraft/` is gone). The relation `Client.minecraftVersion -> api::minecraft.minecraft` is replaced by a plain string custom field.
- `Client.minecraftVersion` is now a `customField` string (the new picker), not a relation. Three new optional version fields have been added on `Client`: `forgeVersion`, `fabricVersion`, `runtimeVersion`. None of the four are localized; they are global per Client (siblings of the localized fields).
- `bundle-registry` is now intended only for mods, configs, resourcepacks, shaderpacks, and overrides. Minecraft game files and JRE files are no longer distributed via `bundle-registry`; they are obtained by the launcher directly from Mojang based on the new version fields.
- A manual data migration is required to backfill the new fields on existing Client entries — see `src/plugins/minecraft-versions/README.md`.



Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
