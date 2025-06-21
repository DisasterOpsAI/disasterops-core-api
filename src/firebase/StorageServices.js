import { storageBucket } from '../config/firebaseConfig.js';
import getLogger from '../config/loggerConfig.js';

const logger = getLogger();

class StorageStore {
  constructor(folderPath = 'uploads') {
    this.folderPath = folderPath;
  }

  async create(fileName, fileBuffer, contentType) {
    try {
      const filePath = `${this.folderPath}/${fileName}`;
      const file = storageBucket.file(filePath);
      const [exists] = await file.exists();
      if (exists) {
        logger.warn(`File already exists, overwriting: ${fileName}`);
      }
      await file.save(fileBuffer, {
        metadata: { contentType },
        resumable: false,
      });

      await file.makePublic();
      const downloadURL = `https://storage.googleapis.com/${storageBucket.name}/${filePath}`;
      logger.info(`File uploaded: ${fileName}`);
      return {
        id: fileName,
        path: filePath,
        downloadURL: downloadURL,
      };
    } catch (error) {
      logger.error(`StorageStore.create failed: ${error.message}`, {
        fileName,
      });
      return `StorageStore.create failed: ${error.message}`;
    }
  }

  async read(fileName) {
    try {
      const filePath = `${this.folderPath}/${fileName}`;
      const file = storageBucket.file(filePath);
      const [exists] = await file.exists();
      if (!exists) {
        logger.warn(`File not found: ${fileName}`);
        return null;
      }

      const downloadURL = `https://storage.googleapis.com/${storageBucket.name}/${filePath}`;
      return {
        id: fileName,
        path: filePath,
        downloadURL: downloadURL,
      };
    } catch (error) {
      logger.error(`StorageStore.read failed: ${error.message}, { fileName }`);
      return `StorageStore.read failed: ${error.message}`;
    }
  }

  async update(fileName, fileBuffer, contentType) {
    try {
      const filePath = `${this.folderPath}/${fileName}`;
      const file = storageBucket.file(filePath);
      const [exists] = await file.exists();
      if (!exists) {
        logger.warn(`File doesn't exist for update: ${fileName}`);
        return null;
      }
      await file.save(fileBuffer, {
        metadata: { contentType },
        resumable: false,
      });

      await file.makePublic();
      const downloadURL = `https://storage.googleapis.com/${storageBucket.name}/${filePath}`;
      logger.info(`File updated: ${fileName}`);
      return {
        id: fileName,
        path: filePath,
        downloadURL: downloadURL,
      };
    } catch (error) {
      logger.error(`StorageStore.update failed: ${error.message}`, {
        fileName,
      });
      return `StorageStore.update failed: ${error.message}`;
    }
  }

  async delete(fileName) {
    try {
      const filePath = `${this.folderPath}/${fileName}`;
      const file = storageBucket.file(filePath);
      const [exists] = await file.exists();
      if (!exists) {
        logger.warn(`File doesn't exist for deletion: ${fileName}`);
        return null;
      }
      await file.delete();

      logger.info(`File deleted: ${fileName}`);
      return { id: fileName };
    } catch (error) {
      logger.error(`StorageStore.delete failed: ${error.message}`, {
        fileName,
      });
      return `StorageStore.delete failed: ${error.message}`;
    }
  }
}

export default StorageStore;
