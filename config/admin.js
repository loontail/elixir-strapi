module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    // Strapi 5.46 deprecated `auth.options.expiresIn` (removed in 6) in
    // favour of an explicit session-lifespan model. Values below mirror
    // Strapi's own defaults — set them explicitly so the deprecation
    // warning stays silent and the migration is already done.
    sessions: {
      maxRefreshTokenLifespan: env.int(
        'ADMIN_SESSION_MAX_REFRESH_SECONDS',
        30 * 24 * 60 * 60, // 30 days
      ),
      idleRefreshTokenLifespan: env.int(
        'ADMIN_SESSION_IDLE_REFRESH_SECONDS',
        14 * 24 * 60 * 60, // 14 days
      ),
      maxSessionLifespan: env.int(
        'ADMIN_SESSION_MAX_SECONDS',
        24 * 60 * 60, // 24 hours
      ),
      idleSessionLifespan: env.int(
        'ADMIN_SESSION_IDLE_SECONDS',
        2 * 60 * 60, // 2 hours
      ),
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
});
