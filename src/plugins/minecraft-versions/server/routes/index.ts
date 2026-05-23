import adminRoutes from './admin.routes';

// The pickers are admin-UI-only — the launcher fetches Mojang/Forge/Fabric
// upstream directly. So we expose only `admin` routes; `content-api` is
// intentionally absent.
export default {
  admin: adminRoutes,
};
