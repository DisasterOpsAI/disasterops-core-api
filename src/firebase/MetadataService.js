import FirestoreStore from './FirestoreStore.js';
import RealtimeStore from './RealtimeStore.js';
import StorageStore from './StorageStore.js';
import getLogger from '../config/loggerConfig.js';

const logger = getLogger();

class MetadataService {
  constructor() {
    this.services = new Map();
    this.initialized = false;
  }

  registerFirestoreCollection(name, collectionName) {
    try {
      this.services.set(name, {
        type: 'firestore',
        instance: new FirestoreStore(collectionName),
      });
      logger.info(`Registered Firestore collection: ${name} -> ${collectionName}`);
    } catch (error) {
      logger.error(`Failed to register Firestore collection ${name}: ${error.message}`);
      throw error;
    }
  }

  registerRealtimeDatabase(name, basePath) {
    try {
      this.services.set(name, {
        type: 'realtime',
        instance: new RealtimeStore(basePath),
      });
      logger.info(`Registered Realtime Database: ${name} -> ${basePath}`);
    } catch (error) {
      logger.error(`Failed to register Realtime Database ${name}: ${error.message}`);
      throw error;
    }
  }

  registerStorageFolder(name, baseFolderPath) {
    try {
      this.services.set(name, {
        type: 'storage',
        instance: new StorageStore(baseFolderPath),
      });
      logger.info(`Registered Storage folder: ${name} -> ${baseFolderPath}`);
    } catch (error) {
      logger.error(`Failed to register Storage folder ${name}: ${error.message}`);
      throw error;
    }
  }

  getService(name) {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found. Available services: ${Array.from(this.services.keys()).join(', ')}`);
    }
    return service;
  }

  async getMetadata(serviceName, id) {
    try {
      const service = this.getService(serviceName);
      return await service.instance.readMetadata(id);
    } catch (error) {
      logger.error(`MetadataService.getMetadata failed: ${error.message}`, {
        serviceName,
        id,
      });
      throw new Error(`MetadataService.getMetadata failed: ${error.message}`);
    }
  }

  async getAdvancedMetadata(serviceName, id) {
    try {
      const service = this.getService(serviceName);
      
      if (typeof service.instance.getAdvancedMetadata === 'function') {
        return await service.instance.getAdvancedMetadata(id);
      }
      
      return await service.instance.readMetadata(id);
    } catch (error) {
      logger.error(`MetadataService.getAdvancedMetadata failed: ${error.message}`, {
        serviceName,
        id,
      });
      throw new Error(`MetadataService.getAdvancedMetadata failed: ${error.message}`);
    }
  }

  async batchGetMetadata(serviceName, ids) {
    try {
      const service = this.getService(serviceName);
      
      if (service.type === 'firestore' && typeof service.instance.batchGetMetadata === 'function') {
        return await service.instance.batchGetMetadata(ids);
      }
      
      const promises = ids.map(id => this.getMetadata(serviceName, id));
      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        logger.warn(`Failed to get metadata for ${ids[index]}: ${result.reason.message}`);
        return null;
      }).filter(Boolean);
    } catch (error) {
      logger.error(`MetadataService.batchGetMetadata failed: ${error.message}`, {
        serviceName,
        ids,
      });
      throw new Error(`MetadataService.batchGetMetadata failed: ${error.message}`);
    }
  }

  async getConnectionStatus(serviceName) {
    try {
      const service = this.getService(serviceName);
      
      if (service.type === 'realtime' && typeof service.instance.getConnectionStatus === 'function') {
        return await service.instance.getConnectionStatus();
      }
      
      return {
        status: 'unknown',
        message: `Connection status not available for ${service.type} services`,
      };
    } catch (error) {
      logger.error(`MetadataService.getConnectionStatus failed: ${error.message}`, {
        serviceName,
      });
      throw new Error(`MetadataService.getConnectionStatus failed: ${error.message}`);
    }
  }

  async getStorageUsage(serviceName) {
    try {
      const service = this.getService(serviceName);
      
      if (service.type === 'storage' && typeof service.instance.getStorageUsage === 'function') {
        return await service.instance.getStorageUsage();
      }
      
      return {
        metadata: {
          error: `Storage usage not available for ${service.type} services`,
        },
      };
    } catch (error) {
      logger.error(`MetadataService.getStorageUsage failed: ${error.message}`, {
        serviceName,
      });
      throw new Error(`MetadataService.getStorageUsage failed: ${error.message}`);
    }
  }

  startRealtimeListener(serviceName, id, callback) {
    try {
      const service = this.getService(serviceName);
      
      if (typeof service.instance.startRealtimeListener === 'function') {
        return service.instance.startRealtimeListener(id, callback);
      }
      
      throw new Error(`Realtime listeners not supported for ${service.type} services`);
    } catch (error) {
      logger.error(`MetadataService.startRealtimeListener failed: ${error.message}`, {
        serviceName,
        id,
      });
      throw new Error(`MetadataService.startRealtimeListener failed: ${error.message}`);
    }
  }

  async queryWithMetadata(serviceName, queryOptions) {
    try {
      const service = this.getService(serviceName);
      
      if (service.type === 'firestore' && typeof service.instance.queryWithMetadata === 'function') {
        return await service.instance.queryWithMetadata(queryOptions);
      }
      
      throw new Error(`Query with metadata not supported for ${service.type} services`);
    } catch (error) {
      logger.error(`MetadataService.queryWithMetadata failed: ${error.message}`, {
        serviceName,
        queryOptions,
      });
      throw new Error(`MetadataService.queryWithMetadata failed: ${error.message}`);
    }
  }

  async listFilesWithMetadata(serviceName, options) {
    try {
      const service = this.getService(serviceName);
      
      if (service.type === 'storage' && typeof service.instance.listFilesWithMetadata === 'function') {
        return await service.instance.listFilesWithMetadata(options);
      }
      
      throw new Error(`File listing not supported for ${service.type} services`);
    } catch (error) {
      logger.error(`MetadataService.listFilesWithMetadata failed: ${error.message}`, {
        serviceName,
        options,
      });
      throw new Error(`MetadataService.listFilesWithMetadata failed: ${error.message}`);
    }
  }

  async getSystemOverview() {
    try {
      const overview = {
        services: {},
        summary: {
          totalServices: this.services.size,
          firestoreServices: 0,
          realtimeServices: 0,
          storageServices: 0,
        },
        generatedAt: new Date().toISOString(),
      };

      for (const [name, service] of this.services) {
        overview.services[name] = {
          type: service.type,
          status: 'active',
        };
        
        overview.summary[`${service.type}Services`]++;
        
        try {
          if (service.type === 'realtime') {
            const connectionStatus = await service.instance.getConnectionStatus();
            overview.services[name].connectionStatus = connectionStatus;
          } else if (service.type === 'storage') {
            const storageUsage = await service.instance.getStorageUsage();
            overview.services[name].storageUsage = storageUsage.metadata;
          }
        } catch (error) {
          overview.services[name].error = error.message;
        }
      }

      return overview;
    } catch (error) {
      logger.error(`MetadataService.getSystemOverview failed: ${error.message}`);
      throw new Error(`MetadataService.getSystemOverview failed: ${error.message}`);
    }
  }

  getRegisteredServices() {
    return Array.from(this.services.entries()).map(([name, service]) => ({
      name,
      type: service.type,
    }));
  }
}

const metadataService = new MetadataService();

export default metadataService;
export { MetadataService };