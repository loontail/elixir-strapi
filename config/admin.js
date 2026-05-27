module.exports = ({ env }) => {
  // Strapi 5 builds the admin panel with Vite. In dev (`strapi develop`)
  // Vite blocks requests whose `Host` header isn't an explicitly-allowed
  // hostname — a DNS-rebinding protection. When this Strapi sits behind
  // Cloudflare (or any reverse proxy), the public hostname must be added
  // here, otherwise the admin reverse-proxied through that hostname
  // returns "Blocked request. This host (...) is not allowed."
  //
  // Derive the allowlist from the same `URL` env that `config/server.js`
  // uses for `server.url`, so a single env var drives both: change `URL`,
  // both the public origin and the admin allowlist follow. Localhost is
  // included unconditionally for direct local-dev access.
  const publicUrl = env('URL', '');
  let publicHost = null;
  try {
    publicHost = publicUrl ? new URL(publicUrl).hostname : null;
  } catch {
    publicHost = null;
  }

  const allowedHosts = ['localhost', '127.0.0.1', ...(publicHost ? [publicHost] : [])];

  return {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
    apiToken: {
      salt: env('API_TOKEN_SALT'),
    },
    transfer: {
      token: {
        salt: env('TRANSFER_TOKEN_SALT'),
      },
    },
    vite: {
      server: {
        allowedHosts,
      },
    },
  };
};
