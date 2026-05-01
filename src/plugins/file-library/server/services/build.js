'use strict';

module.exports = ({ strapi }) => ({
  async findMany(params = {}) {
    return strapi.db.query('plugin::file-library.file-build').findMany({
      orderBy: { createdAt: 'desc' },
      ...params,
    });
  },

  async findOne(slug) {
    const results = await strapi.db.query('plugin::file-library.file-build').findMany({
      where: { slug },
      limit: 1,
    });
    return results[0] || null;
  },

  async create(data) {
    return strapi.db.query('plugin::file-library.file-build').create({ data });
  },

  async update(id, data) {
    return strapi.db.query('plugin::file-library.file-build').update({
      where: { id },
      data,
    });
  },

  async delete(id) {
    return strapi.db.query('plugin::file-library.file-build').delete({ where: { id } });
  },

  async deleteFileEntries(buildId) {
    // deleteMany with a relation filter generates a broken JOIN in the DELETE query.
    // Fetch IDs first, then delete by PK to avoid the "missing FROM-clause for t0" error.
    const entries = await strapi.db.query('plugin::file-library.file-entry').findMany({
      select: ['id'],
      where: { build: buildId },
    });
    if (entries.length === 0) return;
    await strapi.db.query('plugin::file-library.file-entry').deleteMany({
      where: { id: { $in: entries.map((e) => e.id) } },
    });
  },

  async createFileEntries(buildId, scanResults) {
    for (const entry of scanResults) {
      await strapi.db.query('plugin::file-library.file-entry').create({
        data: {
          build: buildId,
          relativePath: entry.relativePath,
          name: entry.name,
          category: entry.category,
          size: entry.size,
          sha256: entry.sha256 || null,
          isDir: entry.isDir,
          downloadOnce: false,
          fileModifiedAt: entry.fileModifiedAt || null,
        },
      });
    }
  },
});
