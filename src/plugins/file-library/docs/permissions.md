# Permissions

## Admin panel

All admin routes (`/file-library/builds/…`) are registered as **type: admin** routes with empty `policies: []`. They are protected automatically by Strapi's built-in admin JWT authentication.

No custom permission policies are applied — any authenticated admin user can perform all operations. If you need role-based access control, add Strapi RBAC policies to the routes in `server/routes/admin.routes.ts`.

## Content API

The manifest endpoint (`GET /api/file-library/builds/:slug/manifest`) is registered as a **content-api** route with `auth: false`, making it publicly accessible without any authentication. This is intentional — a launcher client needs to fetch the manifest without a session.

## Custom field

The `build-picker` custom field (registered via `server/register.ts`) is available in the Content-Type Builder. The field stores a build slug as a plain string. Read/write access is governed by the standard Strapi permissions for the content-type that owns the field.

## Lifecycle hook

The `server/bootstrap.ts` lifecycle hook subscribes to `api::client.client` `afterUpdate` events. When a `fileBuild` field is set on a Client record, it writes back `metadataUrl` using `strapi.db.query` (bypassing entity-service lifecycles to avoid infinite loops). This hook runs with server-level privileges and is not subject to user permissions.
