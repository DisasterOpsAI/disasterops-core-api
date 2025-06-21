import { firestoreDB } from '../../config/firebaseConfig.js';
import getLogger from '../../config/loggerConfig.js';

const logger = getLogger();

class FirestoreStore {
  constructor(collectionName) {
    if (!collectionName) throw new Error("Missing 'collectionName'");
    this.collection = firestoreDB.collection(collectionName);
  }

  async create(id, data) {
    try {
      await this.collection.doc(id).set(data);
      return { id, ...data };
    } catch (err) {
      logger.error(`FirestoreStore.create failed: ${err.message}`, {
        id,
        data,
      });
      return `FirestoreStore.create failed: ${err.message}`;
    }
  }

  async read(id) {
    try {
      const doc = await this.collection.doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (err) {
      logger.error(`FirestoreStore.read failed: ${err.message}`, { id });
      return `FirestoreStore.read failed: ${err.message}`;
    }
  }

  async update(id, data) {
    try {
      await this.collection.doc(id).update(data);
      return { id, ...data };
    } catch (err) {
      logger.error(`FirestoreStore.update failed: ${err.message}`, {
        id,
        data,
      });
      return `FirestoreStore.update failed: ${err.message}`;
    }
  }

  async delete(id) {
    try {
      await this.collection.doc(id).delete();
      return { id };
    } catch (err) {
      logger.error(`FirestoreStore.delete failed: ${err.message}`, { id });
      return `FirestoreStore.delete failed: ${err.message}`;
    }
  }
}

export default FirestoreStore;
