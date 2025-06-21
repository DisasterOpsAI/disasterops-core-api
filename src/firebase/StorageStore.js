import { storageBucket } from '../config/firebaseConfig.js';
import getLogger from '../config/loggerConfig.js';

const logger = getLogger();

class StorageStore {
  constructor(baseFolderPath) {
    if (!baseFolderPath)
      throw new Error('StorageStore requires a baseFolderPath');
    this.baseFolderPath = baseFolderPath;
  }

  getFile(fileName) {
    const filePath = `${this.baseFolderPath}/${fileName}`;
    const file = storageBucket.file(filePath);
    return { file, filePath };
  }

  async create({ fileName, fileBuffer, contentType, makePublic = true }) {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const uniqueName = `${uniqueId}-${fileName}`;
    const { file, filePath } = this.getFile(uniqueName);

    const [exists] = await file.exists();
    if (exists) {
      logger.warn(`File exists, returning URL: ${uniqueName}`);
      const downloadURL = `https://storage.googleapis.com/${storageBucket.name}/${filePath}`;
      return { id: uniqueName, path: filePath, downloadURL };
    }

    await file.save(fileBuffer, {
      metadata: { contentType },
      resumable: false,
    });

    let downloadURL;
    if (makePublic) {
      await file.makePublic();
      downloadURL = `https://storage.googleapis.com/${storageBucket.name}/${filePath}`;
    } else {
      [downloadURL] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 3600000,
      });
    }

    logger.info(`File uploaded: ${uniqueName}`);
    return { id: uniqueName, path: filePath, downloadURL };
  }

  async read(fileName) {
    const { file, filePath } = this.getFile(fileName);
    const [exists] = await file.exists();
    if (!exists) {
      logger.warn(`File not found: ${fileName}`);
      return null;
    }
    const downloadURL = `https://storage.googleapis.com/${storageBucket.name}/${filePath}`;
    return { id: fileName, path: filePath, downloadURL };
  }

  async update({ fileName, fileBuffer, contentType }) {
    const { file, filePath } = this.getFile(fileName);
    const [exists] = await file.exists();
    if (!exists) return null;

    await file.save(fileBuffer, {
      metadata: { contentType },
      resumable: false,
    });
    await file.makePublic();
    const downloadURL = `https://storage.googleapis.com/${storageBucket.name}/${filePath}`;
    logger.info(`File updated: ${fileName}`);
    return { id: fileName, path: filePath, downloadURL };
  }

  async delete(fileName) {
    const { file } = this.getFile(fileName);
    const [exists] = await file.exists();
    if (!exists) return null;
    await file.delete();
    logger.info(`File deleted: ${fileName}`);
    return { id: fileName };
  }
}

export default StorageStore;
