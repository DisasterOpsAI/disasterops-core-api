import { storageBucket } from '../config/firebaseConfig.js';
import getLogger from '../config/loggerConfig.js';

const logger = getLogger();
const RESUMABLE_THRESHOLD = 5 * 1024 * 1024;
const DEFAULT_EXPIRY_MS = 3_600_000;

class StorageStore {
  constructor(baseFolderPath) {
    if (!baseFolderPath) {
      logger.error('Initialization failed: baseFolderPath is required');
      throw new Error('StorageStore requires a baseFolderPath');
    }
    this.baseFolderPath = baseFolderPath;
    logger.info(`StorageStore initialized with base path "${baseFolderPath}"`);
  }

  getFile(fileName) {
    const filePath = `${this.baseFolderPath}/${fileName}`;
    return { file: storageBucket.file(filePath), filePath };
  }

  buildPublicUrl(filePath) {
    return `https://storage.googleapis.com/${storageBucket.name}/${filePath}`;
  }

  async buildSignedUrl(file, expiryMs) {
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiryMs,
    });
    return url;
  }

  async create({ fileName, dataBuffer, metadata = {}, makePublic = true, expiryMs = DEFAULT_EXPIRY_MS }) {
    logger.info(`Creating file "${fileName}"`);
    try {
      const { file, filePath } = this.getFile(fileName);
      const resumable = dataBuffer.length > RESUMABLE_THRESHOLD;

      await file.save(dataBuffer, { metadata, resumable });
      const [meta] = await file.getMetadata();
      const id = meta.id;

      let url;
      if (makePublic) {
        url = this.buildPublicUrl(filePath);
      } else {
        url = await this.buildSignedUrl(file, expiryMs);
      }

      logger.info(`Created "${fileName}" with id ${id}`);
      return { id, name: fileName, path: filePath, url };
    } catch (err) {
      logger.error(`Create failed for "${fileName}": ${err.message}`);
      throw err;
    }
  }

  async read(fileName) {
    logger.info(`Reading file "${fileName}"`);
    try {
      const { file, filePath } = this.getHandle(fileNFile      const [exists] = await file.exists();
      if (!exists) {
        logger.warn(`Read: "${fileName}" not found`);
        return null;
      }

      const [meta] = await file.getMetadata();
      const id = meta.id;
      const url = this.buildPublicUrl(filePath);

      logger.info(`Read "${fileName}" (id ${id})`);
      return { id, name: fileName, path: filePath, url };
    } catch (err) {
      logger.error(`Read failed for "${fileName}": ${err.message}`);
      throw err;
    }
  }

  async update({ fileName, dataBuffer, metadata = {}, makePublic = true, expiryMs = DEFAULT_EXPIRY_MS }) {
    logger.info(`Updating file "${fileName}"`);
    try {
      const { file, filePath } = this.getHandle(fileNFile      const [exists] = await file.exists();
      if (!exists) {
        logger.warn(`Update: "${fileName}" not found`);
        return null;
      }

      const [meta] = await file.getMetadata();
      const existingMeta = meta.metadata || {};
      const combinedMeta = { ...existingMeta, ...metadata };
      const resumable    = dataBuffer.length > RESUMABLE_THRESHOLD;

      await file.save(dataBuffer, { metadata: combinedMeta, resumable });
      const [newMeta] = await file.getMetadata();
      const id = newMeta.id;

      let url;
      if (makePublic) {
        url = this.buildPublicUrl(filePath);
      } else {
        url = await this.buildSignedUrl(file, expiryMs);
      }

      logger.info(`Updated "${fileName}" (id ${id})`);
      return { id, name: fileName, path: filePath, url };
    } catch (err) {
      logger.error(`Update failed for "${fileName}": ${err.message}`);
      throw err;
    }
  }

  async delete(fileName) {
    logger.info(`Deleting file "${fileName}"`);
    try {
      const { file } = this.getFile(fileName);
      const [exists] = await file.exists();
      if (!exists) {
        logger.warn(`Delete: "${fileName}" not found`);
        return null;
      }

      const [meta] = await file.getMetadata();
      const id = meta.id;
      await file.delete();

      logger.info(`Deleted "${fileName}" (id ${id})`);
      return { id, name: fileName };
    } catch (err) {
      logger.error(`Delete failed for "${fileName}": ${err.message}`);
      throw err;
    }
  }
}

export default StorageStore;
