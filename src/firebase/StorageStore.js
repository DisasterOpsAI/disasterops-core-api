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

  _formatResponse(meta, downloadURL) {
    const {
      id,
      name,
      timeCreated,
      updated,
      metadata: customMetadata,
    } = meta;
    return {
      file: {
        id,
        name: name.split('/').pop(),
        path: name,
        downloadURL,
      },
      metadata: {
        createdAt: timeCreated,
        updatedAt: updated,
        custom: customMetadata || {},
      },
    };
  }

  getFile(fileName) {
    const filePath = `${this.baseFolderPath}/${fileName}`;
    const file = storageBucket.file(filePath);
    return { file, filePath };
  }

  getDownloadUrl(filePath) {
    return `https://storage.googleapis.com/${storageBucket.name}/${filePath}`;
  }

  async generateTempPublicUrl(file, expiry) {
    const expiryTime = expiry instanceof Date ? expiry.getTime() : expiry;
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiryTime,
    });
    return url;
  }

  async findFileById(targetId) {
    const [files] = await storageBucket.getFiles({
      prefix: this.baseFolderPath,
    });
    for (const file of files) {
      const [meta] = await file.getMetadata();
      if (meta.id === targetId) return file;
    }
    throw new Error(`File not found: id=${targetId}`);
  }

  async create({ fileName, fileBuffer, metadata = {}, makePublic = false }) {
    try {
      const { file, filePath } = this.getFile(fileName);
      const [exists] = await file.exists();

      if (exists) {
        const [meta] = await file.getMetadata();
        logger.warn(
          `File already exists (id=${meta.id}), returning existing metadata.`
        );
        const downloadURL = this.getDownloadUrl(filePath);
        return this._formatResponse(meta, downloadURL);
      }

      const resumable = fileBuffer.length > CHUNK_SIZE;
      await file.save(fileBuffer, {
        metadata,
        resumable,
      });

      if (makePublic) {
        await file.makePublic();
      }

      const [uploadedMeta] = await file.getMetadata();
      const downloadURL = makePublic ? this.getDownloadUrl(filePath) : undefined;

      logger.info(`File uploaded (id=${uploadedMeta.id}): ${fileName}`);
      return this._formatResponse(uploadedMeta, downloadURL);
    } catch (error) {
      logger.error(`StorageStore.create failed: ${error.message}`, {
        fileName,
      });
      throw new Error(`StorageStore.create failed: ${error.message}`);
    }
  }

  async read(fileId) {
    try {
      const file = await this.findFileById(fileId);
      const [meta] = await file.getMetadata();
      const downloadURL = this.getDownloadUrl(file.name);
      return this._formatResponse(meta, downloadURL);
    } catch (error) {
      logger.error(`StorageStore.read failed: ${error.message}`, { fileId });
      throw new Error(`StorageStore.read failed: ${error.message}`);
    }
  }

  async update({ fileId, fileBuffer, metadata = {}, makePublic = false }) {
    try {
      const file = await this.findFileById(fileId);
      const [oldMeta] = await file.getMetadata();
      const mergedMd = {
        ...(oldMeta.metadata || {}),
        ...metadata,
      };

      const resumable = fileBuffer.length > CHUNK_SIZE;
      await file.save(fileBuffer, { metadata: mergedMd, resumable });

      if (makePublic) {
        await file.makePublic();
      }

      const [newMeta] = await file.getMetadata();
      const downloadURL = makePublic ? this.getDownloadUrl(file.name) : undefined;

      logger.info(`File updated (id=${fileId}): ${file.name.split('/').pop()}`);
      return this._formatResponse(newMeta, downloadURL);
    } catch (error) {
      logger.error(`StorageStore.update failed: ${error.message}`, { fileId });
      throw new Error(`StorageStore.update failed: ${error.message}`);
    }
  }

  async delete(fileId) {
    try {
      const file = await this.findFileById(fileId);
      const filePath = file.name;
      const fileName = filePath.split('/').pop();
      await file.delete();
      logger.info(`File deleted (id=${fileId}): ${fileName}`);
      return {
        file: {
          id: fileId,
          name: fileName,
          path: filePath,
        },
        metadata: {
          deleted: true,
        },
      };
    } catch (error) {
      logger.error(`StorageStore.delete failed: ${error.message}`, { fileId });
      throw new Error(`StorageStore.delete failed: ${error.message}`);
    }
  }
}

export default StorageStore;
