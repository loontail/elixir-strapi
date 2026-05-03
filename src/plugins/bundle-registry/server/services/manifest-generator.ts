import { join } from 'path';
import { existsSync } from 'fs';

import type { Manifest, ManifestEntry } from '../../shared/types/api';
import { getPublicUrl, writeManifestAtomic, getFilesPath } from './storage';

import type { StrapiInstance } from '../types';

const generate = async (buildSlug: string, strapi: StrapiInstance): Promise<Manifest> => {
  const artifacts: Array<{
    relativePath: string;
    name: string;
    category: string;
    size: number | string | null;
    isDir: boolean;
    sha256?: string;
    downloadOnce: boolean;
    build?: { slug: string };
  }> = await strapi.db.query('plugin::bundle-registry.artifact').findMany({
    where: { build: { slug: buildSlug } },
    populate: ['build'],
  });

  const grouped: Manifest = {};

  for (const entry of artifacts) {
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
    }

    if (entry.downloadOnce) {
      fileData.downloadOnce = true;
    }

    grouped[category].push(fileData);
  }

  const filesPath = getFilesPath(buildSlug);
  const filteredGrouped: Manifest = {};
  let filesCount = 0;
  let totalSize = BigInt(0);

  for (const [category, entries] of Object.entries(grouped)) {
    const validEntries = entries.filter(entry => existsSync(join(filesPath, entry.path)));
    if (validEntries.length > 0) {
      filteredGrouped[category] = validEntries;
      for (const entry of validEntries) {
        if (!entry.isDir) {
          filesCount++;
          totalSize += BigInt(entry.size || 0);
        }
      }
    }
  }

  writeManifestAtomic(buildSlug, filteredGrouped);

  const builds: Array<{ id: number }> = await strapi.db
    .query('plugin::bundle-registry.build')
    .findMany({ where: { slug: buildSlug }, limit: 1 });

  if (builds.length > 0) {
    await strapi.db.query('plugin::bundle-registry.build').update({
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

  return filteredGrouped;
};

export { generate };
