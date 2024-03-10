'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateSHA256 (filePath) {
    const fileStat = fs.statSync(filePath)
    return crypto.createHash('sha256').update(String(fileStat.size)).digest('hex')
}

function scanDirectory ({ root, currentDir, baseUrl }) {
  const results = []

  const files = fs.readdirSync(currentDir)
  for (const file of files) {
    const fullPath = path.join(currentDir, file)
    const stats = fs.statSync(fullPath)
    const fileInfo = {
      isDir: stats.isDirectory(),
      name: file,
      path: fullPath.replace(root, '').replace(/\\/g, '/').replace(/\\/g, '/')
    }

    if (fileInfo.isDir) {
      results.push(...scanDirectory({
        root,
        baseUrl,
        currentDir: fullPath
      }))
    } else {
      fileInfo.size = stats.size
      fileInfo.sha256 = generateSHA256(fullPath)
      fileInfo.url = baseUrl.replace('/{PATH}', fullPath.replace(root, '').replace(/\\/g, '/'))
    }

    results.push(fileInfo)
  }

  return results
}

function removeMetadataHash (clientRoot) {
  const hashPath = path.join(clientRoot, 'version-hash')
  if (fs.existsSync(hashPath)) {
    fs.unlinkSync(hashPath)
  }
}

function createMetadataHash (metadata, clientRoot, baseUrl) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(metadata)).digest('hex')
  const hashPath = path.join(clientRoot, 'version-hash')
  fs.writeFileSync(hashPath, hash)

  const hashStat = fs.statSync(hashPath)

  return {
    isDir: false,
    name: 'version-hash',
    path: `/version-hash`,
    size: hashStat.size,
    sha256: hash,
    url: baseUrl.replace('{PATH}', 'version-hash')
  }
}

function removeMetadata (clientRoot) {
  const metadataPath = path.join(clientRoot, 'version-metadata.json')
  if (fs.existsSync(metadataPath)) {
    fs.unlinkSync(metadataPath)
  }
}

function saveMetadata (metadata, clientRoot, baseUrl) {
  const metadataPath = path.join(clientRoot, 'version-metadata.json')

  fs.writeFileSync(metadataPath, JSON.stringify(metadata))
  return {
    isDir: false,
    name: 'version-metadata.json',
    path: `/version-metadata.json`,
    size: metadataPath.size,
    sha256: generateSHA256(metadataPath),
    url: baseUrl.replace('{PATH}', 'version-metadata.json')
  }
}

module.exports = ({ strapi }) => ({
  getClientMetadata(clientSlug) {
    const downloadsRoot = strapi.plugin('metadata').config('downloadsPath');
    const downloadUrl = strapi.plugin('metadata').config('downloadUrl');
    const clientRoot = path.join(downloadsRoot, clientSlug);
    const metadata = {
      root: []
    }

    if (!fs.existsSync(clientRoot)) {
      throw new Error(`Client ${clientSlug} does not exist`);
    }

    const baseUrl = downloadUrl.replace('{SLUG}', clientSlug);

    removeMetadata(clientRoot)
    removeMetadataHash(clientRoot)

    fs.readdirSync(clientRoot).forEach(file => {
      const isDir = fs.statSync(path.join(clientRoot, file)).isDirectory();
      if (isDir) {
        metadata[file] = scanDirectory({
          root: clientRoot,
          baseUrl,
          currentDir: path.join(clientRoot, file)
        })
      } else {
        const fullPath = path.join(clientRoot, file);
        const stats = fs.statSync(fullPath);
        const fileInfo = {
          isDir: false,
          name: file,
          path: fullPath.replace(clientRoot, '').replace(/\\/g, '/').replace(/\\/g, '/')
        };
        fileInfo.size = stats.size;
        fileInfo.sha256 = generateSHA256(fullPath);
        fileInfo.url = baseUrl.replace('/{PATH}', fullPath.replace(clientRoot, '').replace(/\\/g, '/'));
        metadata.root = metadata.root || [];
        metadata.root.push(fileInfo);
      }
    });

    metadata.root.push(saveMetadata(metadata, clientRoot, baseUrl))

    metadata.root.push(createMetadataHash(metadata, clientRoot, baseUrl))

    return metadata
  },
});
