'use strict';

// Hardens the built-in users-permissions content-api so a JWT-authenticated
// user can only update their own row. Without this, anyone with a valid
// session JWT and the `update` permission could `PUT /api/users/<other>`.
//
// Read paths (`/users/me`, list/find) stay as Strapi defines them — they
// already gate sensitive fields on role + the requesting user's identity.

const SELF_ONLY = { name: 'global::self-only', config: { param: 'id' } };

const attachSelfOnly = (route) => {
  const config = route.config || {};
  const policies = Array.isArray(config.policies) ? config.policies : [];
  // Idempotent: skip if Strapi has hot-reloaded and the policy is already in
  // place.
  const hasSelfOnly = policies.some(
    (entry) =>
      entry === 'global::self-only' ||
      (typeof entry === 'object' && entry !== null && entry.name === 'global::self-only'),
  );
  if (hasSelfOnly) return;
  policies.push(SELF_ONLY);
  route.config = { ...config, policies };
};

module.exports = (plugin) => {
  const contentApi = plugin.routes?.['content-api'];
  if (!contentApi?.routes) return plugin;
  for (const route of contentApi.routes) {
    if (route.path === '/users/:id' && (route.method === 'PUT' || route.method === 'DELETE')) {
      attachSelfOnly(route);
    }
  }
  return plugin;
};
