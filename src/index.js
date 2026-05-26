'use strict';

// This app no longer grants any extra permissions to the Authenticated role.
// Everything skin/cape related lives in the Yggdrasil plugin under the Public
// role guarded by a Yggdrasil-token policy (see
// @loontail/strapi-plugin-yggdrasil/server/bootstrap.ts), and the launcher
// no longer mutates `up_users` directly. Keeping the empty hook lifecycle
// makes it obvious where future app-level bootstrap goes.

module.exports = {
  register(/*{ strapi }*/) {},
  bootstrap(/*{ strapi }*/) {},
};
