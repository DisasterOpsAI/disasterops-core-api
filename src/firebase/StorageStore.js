import { storageBucket } from '../config/firebaseConfig.js';
import getLogger from '../config/loggerConfig.js';

const logger = getLogger();
const mbToBytes = (mb) => mb * 1024 * 1024;
const CHUNK_SIZE = mbToBytes(5);

class StorageStore {
  constructor(baseFolderPath) {
    if (!baseFolderPath)
      throw new Error('StorageStore requires a baseFolderPath');
    this.baseFolderPath = baseFolderPath;
    logger.info(
      `StorageStore instance created – basePath="${baseFolderPath}", bucket="${storageBucket.name}"`
    );
  }

  _formatFileMetadata(meta) {
    return {
      id: meta.id,
      name: meta.name.split('/').pop(),
      path: meta.name,
      size: meta.size,
      contentType: meta.contentType,
      createdAt: meta.timeCreated,
      updatedAt: meta.updated,
      custom: meta.metadata || {},
    };
  }

  _formatFile(meta, isPublic) {
    const downloadURL = isPublic
      ? `https://storage.googleapis.com/${storageBucket.name}/${meta.name}`
      : undefined;

    return {
      file: {
        id: meta.id,
        name: meta.name.split('/').pop(),
        path: meta.name,
        downloadURL,
      },
      metadata: this._formatFileMetadata(meta),
    };
  }

  getFile(fileName) {
    const filePath = `${this.baseFolderPath}/${fileName}`;
    return storageBucket.file(filePath);
  }

  async generateTempPublicUrl(fileName, expiry) {
    const file = this.getFile(fileName);
    const expiryTime = expiry instanceof Date ? expiry.getTime() : expiry;
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiryTime,
    });
    return url;
  }

  async create({ fileName, fileBuffer, metadata = {}, makePublic = false }) {
    try {
      const file = this.getFile(fileName);
      const [exists] = await file.exists();

      if (exists) {
        const [meta] = await file.getMetadata();
        logger.warn(
          `File already exists (id=${meta.id}), returning existing metadata.`
        );
        return this._formatFile(meta, makePublic);
      }

      await file.save(fileBuffer, {
        metadata: { metadata },
        resumable: fileBuffer.length > CHUNK_SIZE,
      });

      if (makePublic) {
        await file.makePublic();
      }

      const [uploadedMeta] = await file.getMetadata();
      logger.info(`File uploaded (id=${uploadedMeta.id}): ${fileName}`);
      return this._formatFile(uploadedMeta, makePublic);
    } catch (error) {
      logger.error(`StorageStore.create failed: ${error.message}`, {
        fileName,
      });
      throw new Error(`StorageStore.create failed: ${error.message}`);
    }
  }

  async read(fileName) {
    try {
      const file = this.getFile(fileName);
      const [meta] = await file.getMetadata();
      const [isPublic] = await file.isPublic();
      return this._formatFile(meta, isPublic);
    } catch (error) {
      logger.error(`StorageStore.read failed: ${error.message}`, {
        fileName,
      });
      throw new Error(`StorageStore.read failed: ${error.message}`);
    }
  }

  async readMetadata(fileName) {
    try {
      const file = this.getFile(fileName);
      const [meta] = await file.getMetadata();
      return { metadata: this._formatFileMetadata(meta) };
    } catch (error) {
      logger.error(`StorageStore.readMetadata failed: ${error.message}`, {
        fileName,
      });
      throw new Error(`StorageStore.readMetadata failed: ${error.message}`);
    }
  }

  async update({ fileName, fileBuffer, metadata = {}, makePublic = false }) {
    try {
      const file = this.getFile(fileName);
      const [oldMeta] = await file.getMetadata();
      const mergedMd = {
        ...(oldMeta.metadata || {}),
        ...metadata,
      };

      await file.save(fileBuffer, {
        metadata: { metadata: mergedMd },
        resumable: fileBuffer.length > CHUNK_SIZE,
      });

      if (makePublic) {
        await file.makePublic();
      } else {
        const [isPublic] = await file.isPublic();
        if (isPublic) {
          await file.makePrivate();
        }
      }

      const [newMeta] = await file.getMetadata();
      logger.info(`File updated (id=${newMeta.id}): ${fileName}`);
      return this._formatFile(newMeta, makePublic);
    } catch (error) {
      logger.error(`StorageStore.update failed: ${error.message}`, {
        fileName,
      });
      throw new Error(`StorageStore.update failed: ${error.message}`);
    }
  }

  async delete(fileName) {
    try {
      const file = this.getFile(fileName);
      const [meta] = await file.getMetadata();
      const fileId = meta.id;
      const filePath = file.name;

      await file.delete();
      logger.info(`File deleted (id=${fileId}): ${fileName}`);
      return {
        metadata: {
          id: fileId,
          name: fileName,
          path: filePath,
          deleted: true,
        },
      };
    } catch (error) {
      logger.error(`StorageStore.delete failed: ${error.message}`, {
        fileName,
      });
      throw new Error(`StorageStore.delete failed: ${error.message}`);
    }
  }
}

export default StorageStore;