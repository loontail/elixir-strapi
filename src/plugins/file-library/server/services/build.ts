import type { Build, FileEntry } from '../../shared/types/entities';

type ScanEntry = Omit<FileEntry, 'id' | 'downloadOnce' | 'build'>;

// TODO: type properly — Strapi's Core.Strapi type requires @strapi/strapi package
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildService = ({ strapi }: { strapi: any }) => ({
  async findMany(params: Record<string, unknown> = {}): Promise<Build[]> {
    return strapi.db.query('plugin::file-library.file-build').findMany({
      orderBy: { createdAt: 'desc' },
      ...params,
    });
  },

  async findOne(slug: string): Promise<Build | null> {
    const results: Build[] = await strapi.db
      .query('plugin::file-library.file-build')
      .findMany({ where: { slug }, limit: 1 });
    return results[0] ?? null;
  },

  async create(data: Partial<Build>): Promise<Build> {
    return strapi.db.query('plugin::file-library.file-build').create({ data });
  },

  async update(id: number, data: Partial<Build>): Promise<Build> {
    return strapi.db.query('plugin::file-library.file-build').update({ where: { id }, data });
  },

  async delete(id: number): Promise<void> {
    return strapi.db.query('plugin::file-library.file-build').delete({ where: { id } });
  },

  async deleteFileEntries(buildId: number): Promise<void> {
    // deleteMany with a relation filter generates a broken JOIN in the DELETE query.
    // Fetch IDs first, then delete by PK to avoid the "missing FROM-clause for t0" error.
    const entries: Array<{ id: number }> = await strapi.db
      .query('plugin::file-library.file-entry')
      .findMany({ select: ['id'], where: { build: buildId } });
    if (entries.length === 0) return;
    await strapi.db.query('plugin::file-library.file-entry').deleteMany({
      where: { id: { $in: entries.map((e) => e.id) } },
    });
  },

  async createFileEntries(buildId: number, scanResults: ScanEntry[]): Promise<void> {
    for (const entry of scanResults) {
      await strapi.db.query('plugin::file-library.file-entry').create({
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
});

export default buildService;
