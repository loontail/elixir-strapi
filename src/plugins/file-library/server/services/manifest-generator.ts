import type { Manifest, ManifestEntry } from '../../shared/types/api';
import { getPublicUrl, writeManifestAtomic } from './storage';

import type { StrapiInstance } from '../types';

const generate = async (buildSlug: string, strapi: StrapiInstance): Promise<Manifest> => {
  const fileEntries: Array<{
    relativePath: string;
    name: string;
    category: string;
    size: number | string | null;
    isDir: boolean;
    sha256?: string;
    downloadOnce: boolean;
    build?: { slug: string };
  }> = await strapi.db.query('plugin::file-library.file-entry').findMany({
    where: { build: { slug: buildSlug } },
    populate: ['build'],
  });

  const grouped: Manifest = {};
  let filesCount = 0;
  let totalSize = BigInt(0);

  for (const entry of fileEntries) {
    const category = entry.category || 'root';
    if (!grouped[category]) grouped[category] = [];

    const fileData: ManifestEntry = {
      path: entry.relativePath,
      name: entry.name,
      size: Number(entry.size || 0),
      isDir: entry.isDir,
    };

    if (!entry.isDir) {
      fileData.sha256 = entry.sha256;
      fileData.url = getPublicUrl(buildSlug, entry.relativePath, strapi);
      filesCount++;
      totalSize += BigInt(entry.size || 0);
    }

    if (entry.downloadOnce) {
      fileData.downloadOnce = true;
    }

    grouped[category].push(fileData);
  }

  writeManifestAtomic(buildSlug, grouped);

  const builds: Array<{ id: number }> = await strapi.db
    .query('plugin::file-library.file-build')
    .findMany({ where: { slug: buildSlug }, limit: 1 });

  if (builds.length > 0) {
    await strapi.db.query('plugin::file-library.file-build').update({
      where: { id: builds[0].id },
      data: {
        status: 'ready',
        filesCount,
        totalSize: totalSize.toString(),
        lastGeneratedAt: new Date(),
        processingError: null,
      },
    });
  }

  return grouped;
};

export { generate };
