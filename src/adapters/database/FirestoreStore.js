import PersistentStore from './PersistentStore.js';
import { firestore } from '../../config/firebaseConfig.js';

class FirestoreStore extends PersistentStore {
  constructor(collectionName) {
    super();
    if (!collectionName) throw new Error("Missing 'collectionName'");
    this.collection = firestore.collection(collectionName);
  }

  async create(id, data) {
    try {
      await this.collection.doc(id).set(data);
      return { id, ...data };
    } catch (err) {
      throw new Error(`FirestoreStore.create failed: ${err.message}`);
    }
  }

  async read(id) {
    try {
      const doc = await this.collection.doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (err) {
      throw new Error(`FirestoreStore.read failed: ${err.message}`);
    }
  }

  async update(id, data) {
    try {
      await this.collection.doc(id).update(data);
      return { id, ...data };
    } catch (err) {
      throw new Error(`FirestoreStore.update failed: ${err.message}`);
    }
  }

  async delete(id) {
    try {
      await this.collection.doc(id).delete();
      return { id };
    } catch (err) {
      throw new Error(`FirestoreStore.delete failed: ${err.message}`);
    }
  }
}

export default FirestoreStore;
