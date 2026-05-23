'use strict';

// Allows the request only if a route param matches the authenticated user's
// id. Defaults to checking `ctx.params.userId`; override via the policy
// `config.param` when attaching to a route whose user id lives elsewhere
// (e.g. `id` on the core users-permissions `PUT /users/:id`).
//
//   { name: 'global::self-only' }                          // checks userId
//   { name: 'global::self-only', config: { param: 'id' } } // checks id

module.exports = (ctx, config) => {
  const paramName = (config && config.param) || 'userId';
  const stateUserId = ctx.state?.user?.id;
  if (typeof stateUserId !== 'number') return false;

  const rawParam = ctx.params?.[paramName];
  const paramId = typeof rawParam === 'string' ? Number(rawParam) : Number(rawParam);
  if (!Number.isFinite(paramId) || paramId <= 0) return false;

  return paramId === stateUserId;
};
