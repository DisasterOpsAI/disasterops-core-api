import admin from 'firebase-admin';
import { realtimeDB } from '../config/firebaseConfig.js';
import getLogger from '../config/loggerConfig.js';

const logger = getLogger();

class RealtimeStore {
  constructor(basePath) {
    if (!basePath) throw new Error("Missing 'basePath'.");
    this.basePath = basePath;
    this._setupConnectionListeners();
  }

  buildRef(id) {
    return realtimeDB.ref(`${this.basePath}/${id}`);
  }

  _setupConnectionListeners() {
    const connectedRef = realtimeDB.ref('.info/connected');
    const offsetRef = realtimeDB.ref('.info/serverTimeOffset');

    connectedRef.on('value', (snapshot) => {
      const connected = snapshot.val();
      logger.info(`Realtime Database connection status: ${connected ? 'connected' : 'disconnected'}`);
    });

    offsetRef.on('value', (snapshot) => {
      const offset = snapshot.val() || 0;
      this.serverTimeOffset = offset;
      logger.debug(`Server time offset: ${offset}ms`);
    });
  }

  _formatSnapshot(snapshot) {
    const data = snapshot.val();
    if (!data) return null;
    
    const { createdAt, updatedAt, ...userData } = data;
    return {
      data: userData,
      metadata: {
        id: snapshot.key,
        ref: snapshot.ref.toString(),
        exists: snapshot.exists(),
        priority: snapshot.getPriority(),
        createdAt,
        updatedAt,
        estimatedServerTime: this.getEstimatedServerTime(),
      },
    };
  }

  getEstimatedServerTime() {
    return new Date(Date.now() + (this.serverTimeOffset || 0));
  }

  getConnectionStatus() {
    return new Promise((resolve) => {
      const connectedRef = realtimeDB.ref('.info/connected');
      connectedRef.once('value', (snapshot) => {
        resolve({
          connected: snapshot.val(),
          serverTimeOffset: this.serverTimeOffset || 0,
          estimatedServerTime: this.getEstimatedServerTime(),
        });
      });
    });
  }

  async create(id, data) {
    const ref = this.buildRef(id);
    try {
      await ref.set({
        ...data,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      });
      const snapshot = await ref.once('value');
      return this._formatSnapshot(snapshot);
    } catch (error) {
      logger.error(`RealtimeStore.create failed: ${error.message}`, {
        id,
        data,
      });
      throw new Error(`RealtimeStore.create failed: ${error.message}`);
    }
  }

  async read(id) {
    const ref = this.buildRef(id);
    try {
      const snapshot = await ref.once('value');
      if (!snapshot.exists()) return null;
      return this._formatSnapshot(snapshot);
    } catch (error) {
      logger.error(`RealtimeStore.read failed: ${error.message}`, { id });
      throw new Error(`RealtimeStore.read failed: ${error.message}`);
    }
  }

  async readMetadata(id) {
    const ref = this.buildRef(id);
    try {
      const snapshot = await ref.once('value');
      if (!snapshot.exists()) return null;
      const { metadata } = this._formatSnapshot(snapshot);
      return { metadata };
    } catch (error) {
      logger.error(`RealtimeStore.readMetadata failed: ${error.message}`, {
        id,
      });
      throw new Error(`RealtimeStore.readMetadata failed: ${error.message}`);
    }
  }

  async update(id, data) {
    const ref = this.buildRef(id);
    try {
      await ref.update({
        ...data,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      });
      const snapshot = await ref.once('value');
      return this._formatSnapshot(snapshot);
    } catch (error) {
      logger.error(`RealtimeStore.update failed: ${error.message}`, {
        id,
        data,
      });
      throw new Error(`RealtimeStore.update failed: ${error.message}`);
    }
  }

  async delete(id) {
    const ref = this.buildRef(id);
    try {
      await ref.remove();
      return { metadata: { id, deleted: true } };
    } catch (error) {
      logger.error(`RealtimeStore.delete failed: ${error.message}`, {
        id,
      });
      throw new Error(`RealtimeStore.delete failed: ${error.message}`);
    }
  }

  async setPriority(id, priority) {
    const ref = this.buildRef(id);
    try {
      await ref.setPriority(priority);
      const snapshot = await ref.once('value');
      return this._formatSnapshot(snapshot);
    } catch (error) {
      logger.error(`RealtimeStore.setPriority failed: ${error.message}`, {
        id,
        priority,
      });
      throw new Error(`RealtimeStore.setPriority failed: ${error.message}`);
    }
  }

  async getAdvancedMetadata(id) {
    const ref = this.buildRef(id);
    try {
      const snapshot = await ref.once('value');
      if (!snapshot.exists()) return null;

      const connectionStatus = await this.getConnectionStatus();
      const data = snapshot.val();
      const { createdAt, updatedAt, ...userData } = data;

      return {
        metadata: {
          id: snapshot.key,
          ref: snapshot.ref.toString(),
          exists: snapshot.exists(),
          priority: snapshot.getPriority(),
          numChildren: snapshot.numChildren(),
          hasChildren: snapshot.hasChildren(),
          createdAt,
          updatedAt,
          dataSize: JSON.stringify(userData).length,
          connectionStatus,
          retrievedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error(`RealtimeStore.getAdvancedMetadata failed: ${error.message}`, {
        id,
      });
      throw new Error(`RealtimeStore.getAdvancedMetadata failed: ${error.message}`);
    }
  }

  startRealtimeListener(id, callback) {
    const ref = this.buildRef(id);
    const listener = ref.on('value', (snapshot) => {
      const formattedData = this._formatSnapshot(snapshot);
      callback(formattedData);
    });
    
    return () => ref.off('value', listener);
  }

  async getChildrenMetadata(id) {
    const ref = this.buildRef(id);
    try {
      const snapshot = await ref.once('value');
      if (!snapshot.exists()) return null;

      const children = [];
      snapshot.forEach((childSnapshot) => {
        const childData = this._formatSnapshot(childSnapshot);
        if (childData) {
          children.push(childData);
        }
      });

      return {
        metadata: {
          id: snapshot.key,
          numChildren: snapshot.numChildren(),
          hasChildren: snapshot.hasChildren(),
          children,
        },
      };
    } catch (error) {
      logger.error(`RealtimeStore.getChildrenMetadata failed: ${error.message}`, {
        id,
      });
      throw new Error(`RealtimeStore.getChildrenMetadata failed: ${error.message}`);
    }
  }
}

export default RealtimeStore;
