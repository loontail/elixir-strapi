import type { Build, Artifact } from '../../shared/types/entities';

type ScanEntry = Omit<Artifact, 'id' | 'downloadOnce' | 'build'>;

import type { StrapiInstance } from '../types';

const buildService = ({ strapi }: { strapi: StrapiInstance }) => ({
  async findMany(params: Record<string, unknown> = {}): Promise<Build[]> {
    return strapi.db.query('plugin::bundle-registry.build').findMany({
      orderBy: { createdAt: 'desc' },
      ...params,
    });
  },

  async findOne(slug: string): Promise<Build | null> {
    const results: Build[] = await strapi.db
      .query('plugin::bundle-registry.build')
      .findMany({ where: { slug }, limit: 1 });
    return results[0] ?? null;
  },

  async create(data: Partial<Build>): Promise<Build> {
    return strapi.db.query('plugin::bundle-registry.build').create({ data });
  },

  async update(id: number, data: Partial<Build>): Promise<Build> {
    return strapi.db.query('plugin::bundle-registry.build').update({ where: { id }, data });
  },

  async delete(id: number): Promise<void> {
    return strapi.db.query('plugin::bundle-registry.build').delete({ where: { id } });
  },

  async deleteFileEntries(buildId: number): Promise<void> {
    // deleteMany with a relation filter generates a broken JOIN in the DELETE query.
    // Fetch IDs first, then delete by PK to avoid the "missing FROM-clause for t0" error.
    const entries: Array<{ id: number }> = await strapi.db
      .query('plugin::bundle-registry.artifact')
      .findMany({ select: ['id'], where: { build: buildId } });
    if (entries.length === 0) return;
    await strapi.db.query('plugin::bundle-registry.artifact').deleteMany({
      where: { id: { $in: entries.map((e) => e.id) } },
    });
  },

  async createFileEntries(buildId: number, scanResults: ScanEntry[]): Promise<void> {
    for (const entry of scanResults) {
      await strapi.db.query('plugin::bundle-registry.artifact').create({
        data: {
          build: buildId,
          relativePath: entry.relativePath,
          name: entry.name,
          category: entry.category,
          size: entry.size,
          sha256: entry.sha256 ?? null,
          isDir: entry.isDir,
          downloadOnce: false,
          fileModifiedAt: entry.fileModifiedAt ?? null,
        },
      });
    }
  },

  async upsertFileEntries(buildId: number, scanResults: ScanEntry[]): Promise<void> {
    const existing: Array<{ id: number; relativePath: string }> = await strapi.db
      .query('plugin::bundle-registry.artifact')
      .findMany({ where: { build: buildId }, select: ['id', 'relativePath'] });
    const existingMap = new Map(existing.map((e) => [e.relativePath, e.id]));

    for (const entry of scanResults) {
      const existingId = existingMap.get(entry.relativePath);
      if (existingId !== undefined) {
        await strapi.db.query('plugin::bundle-registry.artifact').update({
          where: { id: existingId },
          data: {
            name: entry.name,
            category: entry.category,
            size: entry.size,
            sha256: entry.sha256 ?? null,
            fileModifiedAt: entry.fileModifiedAt ?? null,
          },
        });
      } else {
        await strapi.db.query('plugin::bundle-registry.artifact').create({
          data: {
            build: buildId,
            relativePath: entry.relativePath,
            name: entry.name,
            category: entry.category,
            size: entry.size,
            sha256: entry.sha256 ?? null,
            isDir: entry.isDir,
            downloadOnce: false,
            fileModifiedAt: entry.fileModifiedAt ?? null,
          },
        });
      }
    }
  },
});

export default buildService;
