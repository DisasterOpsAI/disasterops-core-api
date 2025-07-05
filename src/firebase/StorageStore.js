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
      fullPath: meta.name,
      size: meta.size,
      contentType: meta.contentType,
      cacheControl: meta.cacheControl,
      contentDisposition: meta.contentDisposition,
      contentEncoding: meta.contentEncoding,
      contentLanguage: meta.contentLanguage,
      createdAt: meta.timeCreated,
      updatedAt: meta.updated,
      md5Hash: meta.md5Hash,
      etag: meta.etag,
      generation: meta.generation,
      metageneration: meta.metageneration,
      storageClass: meta.storageClass,
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

  async getAdvancedMetadata(fileName) {
    try {
      const file = this.getFile(fileName);
      const [meta] = await file.getMetadata();
      const [isPublic] = await file.isPublic();
      const [exists] = await file.exists();

      return {
        metadata: {
          ...this._formatFileMetadata(meta),
          exists,
          isPublic,
          bucket: storageBucket.name,
          downloadTokens: meta.downloadTokens,
          kmsKeyName: meta.kmsKeyName,
          eventBasedHold: meta.eventBasedHold,
          temporaryHold: meta.temporaryHold,
          retentionExpirationTime: meta.retentionExpirationTime,
          retrievedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error(`StorageStore.getAdvancedMetadata failed: ${error.message}`, {
        fileName,
      });
      throw new Error(`StorageStore.getAdvancedMetadata failed: ${error.message}`);
    }
  }

  async updateMetadata(fileName, metadata) {
    try {
      const file = this.getFile(fileName);
      const [currentMeta] = await file.getMetadata();
      
      const updatedMetadata = {
        ...currentMeta.metadata,
        ...metadata,
      };

      await file.setMetadata({ metadata: updatedMetadata });
      const [newMeta] = await file.getMetadata();
      
      logger.info(`File metadata updated (id=${newMeta.id}): ${fileName}`);
      return {
        metadata: this._formatFileMetadata(newMeta),
      };
    } catch (error) {
      logger.error(`StorageStore.updateMetadata failed: ${error.message}`, {
        fileName,
        metadata,
      });
      throw new Error(`StorageStore.updateMetadata failed: ${error.message}`);
    }
  }

  async getFileSize(fileName) {
    try {
      const file = this.getFile(fileName);
      const [meta] = await file.getMetadata();
      return {
        metadata: {
          id: meta.id,
          name: fileName,
          size: meta.size,
          sizeFormatted: this._formatFileSize(meta.size),
        },
      };
    } catch (error) {
      logger.error(`StorageStore.getFileSize failed: ${error.message}`, {
        fileName,
      });
      throw new Error(`StorageStore.getFileSize failed: ${error.message}`);
    }
  }

  async listFilesWithMetadata(options = {}) {
    try {
      const { prefix = this.baseFolderPath, maxResults = 1000 } = options;
      const [files] = await storageBucket.getFiles({
        prefix,
        maxResults,
      });

      const filesWithMetadata = await Promise.all(
        files.map(async (file) => {
          try {
            const [meta] = await file.getMetadata();
            const [isPublic] = await file.isPublic();
            return this._formatFile(meta, isPublic);
          } catch (error) {
            logger.warn(`Failed to get metadata for file ${file.name}: ${error.message}`);
            return null;
          }
        })
      );

      return {
        files: filesWithMetadata.filter(Boolean),
        metadata: {
          totalFiles: filesWithMetadata.length,
          prefix,
          retrievedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error(`StorageStore.listFilesWithMetadata failed: ${error.message}`, {
        options,
      });
      throw new Error(`StorageStore.listFilesWithMetadata failed: ${error.message}`);
    }
  }

  async copyFile(sourceFileName, destinationFileName, options = {}) {
    try {
      const sourceFile = this.getFile(sourceFileName);
      const destFile = this.getFile(destinationFileName);
      
      await sourceFile.copy(destFile, options);
      
      const [sourceMeta] = await sourceFile.getMetadata();
      const [destMeta] = await destFile.getMetadata();
      
      logger.info(`File copied from ${sourceFileName} to ${destinationFileName}`);
      return {
        source: this._formatFileMetadata(sourceMeta),
        destination: this._formatFileMetadata(destMeta),
      };
    } catch (error) {
      logger.error(`StorageStore.copyFile failed: ${error.message}`, {
        sourceFileName,
        destinationFileName,
      });
      throw new Error(`StorageStore.copyFile failed: ${error.message}`);
    }
  }

  _formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }

  async getStorageUsage() {
    try {
      const [files] = await storageBucket.getFiles({ prefix: this.baseFolderPath });
      let totalSize = 0;
      let fileCount = 0;

      for (const file of files) {
        try {
          const [meta] = await file.getMetadata();
          totalSize += parseInt(meta.size || 0, 10);
          fileCount++;
        } catch (error) {
          logger.warn(`Failed to get size for file ${file.name}: ${error.message}`);
        }
      }

      return {
        metadata: {
          totalFiles: fileCount,
          totalSize,
          totalSizeFormatted: this._formatFileSize(totalSize),
          basePath: this.baseFolderPath,
          bucket: storageBucket.name,
          calculatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error(`StorageStore.getStorageUsage failed: ${error.message}`);
      throw new Error(`StorageStore.getStorageUsage failed: ${error.message}`);
    }
  }
}

export default StorageStore;