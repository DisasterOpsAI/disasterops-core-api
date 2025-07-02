import { storageBucket } from '../config/firebaseConfig.js';
import getLogger from '../config/loggerConfig.js';

const logger = getLogger();
const CHUNK_SIZE = 5 * 1024 * 1024;

class StorageStore {
  constructor(baseFolderPath) {
    if (!baseFolderPath)
      throw new Error('StorageStore requires a baseFolderPath');
    this.baseFolderPath = baseFolderPath;
    logger.info(
      `StorageStore instance created – basePath="${baseFolderPath}", bucket="${storageBucket.name}"`
    );
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
    const { file, filePath } = this.getFile(fileName);
    const [exists] = await file.exists();
    if (exists) {
      const [meta] = await file.getMetadata();
      const existingId = meta.id;
      const existingMd = meta.metadata || {};
      logger.warn(
        `File already exists (id=${existingId}), returning existing URL`
      );
      return {
        id: existingId,
        name: fileName,
        path: filePath,
        downloadURL: this.getDownloadUrl(filePath),
        metadata: existingMd,
      };
    }
    const resumable = fileBuffer.length > CHUNK_SIZE;
    await file.save(fileBuffer, { metadata, resumable });
    const [uploadedMeta] = await file.getMetadata();
    const fileId = uploadedMeta.id;
    const newMd = uploadedMeta.metadata || {};
    let downloadURL;
    if (makePublic) {
      await file.makePublic();
      downloadURL = this.getDownloadUrl(filePath);
    }
    logger.info(`File uploaded (id=${fileId}): ${fileName}`);
    return {
      id: fileId,
      name: fileName,
      path: filePath,
      downloadURL,
      metadata: newMd,
    };
  }

  async read(fileId) {
    const file = await this.findFileById(fileId);
    const filePath = file.name;
    const fileName = filePath.split('/').pop();
    const [meta] = await file.getMetadata();
    const md = meta.metadata || {};
    return {
      id: fileId,
      name: fileName,
      path: filePath,
      downloadURL: this.getDownloadUrl(filePath),
      metadata: md,
    };
  }

  async update({ fileId, fileBuffer, metadata = {}, makePublic = false }) {
    const file = await this.findFileById(fileId);
    const filePath = file.name;
    const fileName = filePath.split('/').pop();
    const [oldMeta] = await file.getMetadata();
    const existingMd = oldMeta.metadata || {};
    const mergedMd = { ...existingMd, ...metadata };
    const resumable = fileBuffer.length > CHUNK_SIZE;
    await file.save(fileBuffer, { metadata: mergedMd, resumable });
    const [newMeta] = await file.getMetadata();
    const newMd = newMeta.metadata || {};
    let downloadURL;
    if (makePublic) {
      await file.makePublic();
      downloadURL = this.getDownloadUrl(filePath);
    }
    logger.info(`File updated (id=${fileId}): ${fileName}`);
    return {
      id: fileId,
      name: fileName,
      path: filePath,
      downloadURL,
      metadata: newMd,
    };
  }

  async delete(fileId) {
    const file = await this.findFileById(fileId);
    const filePath = file.name;
    const fileName = filePath.split('/').pop();
    await file.delete();
    logger.info(`File deleted (id=${fileId}): ${fileName}`);
    return {
      id: fileId,
      name: fileName,
      path: filePath,
    };
  }
}

export default StorageStore;
