import admin from 'firebase-admin';
import { firestoreDB } from '../../config/firebaseConfig.js';
import getLogger from '../../config/loggerConfig.js';

const logger = getLogger();

class FirestoreStore {
  constructor(collectionName) {
    if (!collectionName) throw new Error("Missing 'collectionName'");
    this.collection = firestoreDB.collection(collectionName);
  }
  _getMetadata(id, data) {
    return {
      id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async create(id, data) {
    try {
      await this.collection.doc(id).set({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const snap = await this.collection.doc(id).get();
      const docData = snap.data();
      const { createdAt, updatedAt, ...userData } = docData;
      return {
        data: userData,
        metadata: this._getMetadata(snap.id, docData),
      };
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
      const docData = doc.data();
      const { createdAt, updatedAt, ...userData } = docData;
      return {
        data: userData,
        metadata: this._getMetadata(doc.id, docData),
      };
    } catch (err) {
      logger.error(`FirestoreStore.read failed: ${err.message}`, { id });
      throw new Error(`FirestoreStore.read failed: ${err.message}`);
    }
  }

  async update(id, data) {
    try {
      await this.collection.doc(id).update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const snap = await this.collection.doc(id).get();
      const docData = snap.data();
      const { createdAt, updatedAt, ...userData } = docData;
      return {
        data: userData,
        metadata: this._getMetadata(snap.id, docData),
      };
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
      return { metadata: { id } };
    } catch (err) {
      logger.error(`FirestoreStore.delete failed: ${err.message}`, { id });
      throw new Error(`FirestoreStore.delete failed: ${err.message}`);
    }
  }
}

export default FirestoreStore;
