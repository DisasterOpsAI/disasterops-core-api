import admin from 'firebase-admin';
import { realtimeDB } from '../config/firebaseConfig.js';
import getLogger from '../config/loggerConfig.js';

const logger = getLogger();

class FirebaseRealtimeStore {
  constructor(basePath) {
    if (!basePath) throw new Error("Missing Details. Required 'basePath'.");
    this.basePath = basePath;
  }

  buildRef(id) {
    return realtimeDB.ref(`${this.basePath}/${id}`);
  }

  _formatResponse(id, snapshot) {
    const val = snapshot.val() || {};
    const { createdAt, updatedAt, ...userData } = val;
    return {
      data: userData,
      metadata: { id, createdAt, updatedAt },
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
      return this._formatResponse(id, snapshot);
    } catch (error) {
      logger.error(`Firebase Realtime Store Create Failed: ${error.message}`, {
        id,
        data,
      });
      throw new Error(
        `Firebase Realtime Store Create Failed: ${error.message}`
      );
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
      return this._formatResponse(id, snapshot);
    } catch (error) {
      logger.error(`Firebase Realtime Store Update Failed: ${error.message}`, {
        id,
        data,
      });
      throw new Error(
        `Firebase Realtime Store Update Failed: ${error.message}`
      );
    }
  }

  async delete(id) {
    const ref = this.buildRef(id);
    try {
      await ref.remove();
      return { metadata: { id } };
    } catch (error) {
      logger.error(`Firebase Realtime Store Delete Failed: ${error.message}`, {
        id,
      });
      throw new Error(
        `Firebase Realtime Store Delete Failed: ${error.message}`
      );
    }
  }

  async read(id) {
    const ref = this.buildRef(id);
    try {
      const snapshot = await ref.once('value');
      if (!snapshot.exists()) return null;
      return this._formatResponse(id, snapshot);
    } catch (error) {
      logger.error(`Firebase Realtime Store Read Failed: ${error.message}`, {
        id,
      });
      throw new Error(`Firebase Realtime Store Read Failed: ${error.message}`);
    }
  }
}

export default FirebaseRealtimeStore;
