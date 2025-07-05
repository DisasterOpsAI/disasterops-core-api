import admin from 'firebase-admin';
import { firestoreDB } from '../../config/firebaseConfig.js';
import getLogger from '../../config/loggerConfig.js';

const logger = getLogger();

class FirestoreStore {
  constructor(collectionName) {
    if (!collectionName) throw new Error("Missing 'collectionName'");
    this.collection = firestoreDB.collection(collectionName);
  }

  _formatDoc(doc) {
    const docData = doc.data();
    const { createdAt, updatedAt, ...data } = docData;
    return {
      data,
      metadata: {
        id: doc.id,
        createdAt: createdAt || doc.createTime,
        updatedAt: updatedAt || doc.updateTime,
        fromCache: doc.metadata.fromCache,
      },
    };
  }

  async create(id, data) {
    try {
      const docRef = this.collection.doc(id);
      await docRef.set({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const doc = await docRef.get();
      return this._formatDoc(doc);
    } catch (err) {
      logger.error(`FirestoreStore.create failed: ${err.message}`, {
        id,
        data,
      });
      throw new Error(`FirestoreStore.create failed: ${err.message}`);
    }
  }

  async read(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) return null;
      return this._formatDoc(doc);
    } catch (err) {
      logger.error(`FirestoreStore.read failed: ${err.message}`, { id });
      throw new Error(`FirestoreStore.read failed: ${err.message}`);
    }
  }

  async readMetadata(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) return null;
      const { metadata } = this._formatDoc(doc);
      return { metadata };
    } catch (err) {
      logger.error(`FirestoreStore.readMetadata failed: ${err.message}`, {
        id,
      });
      throw new Error(`FirestoreStore.readMetadata failed: ${err.message}`);
    }
  }

  async update(id, data) {
    try {
      const docRef = this.collection.doc(id);
      await docRef.update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const doc = await docRef.get();
      return this._formatDoc(doc);
    } catch (err) {
      logger.error(`FirestoreStore.update failed: ${err.message}`, {
        id,
        data,
      });
      throw new Error(`FirestoreStore.update failed: ${err.message}`);
    }
  }

  async delete(id) {
    try {
      await this.collection.doc(id).delete();
      return { metadata: { id, deleted: true } };
    } catch (err) {
      logger.error(`FirestoreStore.delete failed: ${err.message}`, { id });
      throw new Error(`FirestoreStore.delete failed: ${err.message}`);
    }
  }
}

export default FirestoreStore;
