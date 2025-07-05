import admin from 'firebase-admin';
import { realtimeDB } from '../config/firebaseConfig.js';
import getLogger from '../config/loggerConfig.js';

const logger = getLogger();

class RealtimeStore {
  constructor(basePath) {
    if (!basePath) throw new Error("Missing 'basePath'.");
    this.basePath = basePath;
  }

  buildRef(id) {
    return realtimeDB.ref(`${this.basePath}/${id}`);
  }

  _formatSnapshot(snapshot) {
    const data = snapshot.val();
    const { createdAt, updatedAt, ...userData } = data;
    return {
      data: userData,
      metadata: {
        id: snapshot.key,
        createdAt,
        updatedAt,
      },
    };
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
}

export default RealtimeStore;
