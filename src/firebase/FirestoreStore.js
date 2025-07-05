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
    if (!docData) return null;
    
    const { createdAt, updatedAt, ...data } = docData;
    return {
      data,
      metadata: {
        id: doc.id,
        ref: doc.ref.path,
        exists: doc.exists,
        createdAt: createdAt || doc.createTime,
        updatedAt: updatedAt || doc.updateTime,
        fromCache: doc.metadata.fromCache,
        hasPendingWrites: doc.metadata.hasPendingWrites,
        isEqual: (other) => doc.isEqual(other),
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

  async getAdvancedMetadata(id) {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return null;

      const docData = doc.data();
      const { createdAt, updatedAt, ...data } = docData;

      return {
        metadata: {
          id: doc.id,
          ref: doc.ref.path,
          exists: doc.exists,
          createdAt: createdAt || doc.createTime,
          updatedAt: updatedAt || doc.updateTime,
          fromCache: doc.metadata.fromCache,
          hasPendingWrites: doc.metadata.hasPendingWrites,
          dataSize: JSON.stringify(data).length,
          fieldCount: Object.keys(data).length,
          collectionId: doc.ref.parent.id,
          collectionPath: doc.ref.parent.path,
          retrievedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      logger.error(`FirestoreStore.getAdvancedMetadata failed: ${err.message}`, { id });
      throw new Error(`FirestoreStore.getAdvancedMetadata failed: ${err.message}`);
    }
  }

  async batchGetMetadata(ids) {
    try {
      const promises = ids.map(id => this.collection.doc(id).get());
      const docs = await Promise.all(promises);
      
      return docs.map(doc => {
        if (!doc.exists) return null;
        const formatted = this._formatDoc(doc);
        return formatted ? formatted.metadata : null;
      }).filter(Boolean);
    } catch (err) {
      logger.error(`FirestoreStore.batchGetMetadata failed: ${err.message}`, { ids });
      throw new Error(`FirestoreStore.batchGetMetadata failed: ${err.message}`);
    }
  }

  startRealtimeListener(id, callback) {
    const docRef = this.collection.doc(id);
    const unsubscribe = docRef.onSnapshot(
      { includeMetadataChanges: true },
      (doc) => {
        const formattedData = this._formatDoc(doc);
        callback(formattedData);
      },
      (error) => {
        logger.error(`FirestoreStore.startRealtimeListener failed: ${error.message}`, { id });
        callback(null, error);
      }
    );
    
    return unsubscribe;
  }

  async queryWithMetadata(queryOptions = {}) {
    try {
      let query = this.collection;
      
      if (queryOptions.where) {
        queryOptions.where.forEach(([field, operator, value]) => {
          query = query.where(field, operator, value);
        });
      }
      
      if (queryOptions.orderBy) {
        queryOptions.orderBy.forEach(([field, direction = 'asc']) => {
          query = query.orderBy(field, direction);
        });
      }
      
      if (queryOptions.limit) {
        query = query.limit(queryOptions.limit);
      }
      
      const snapshot = await query.get();
      
      return {
        docs: snapshot.docs.map(doc => this._formatDoc(doc)).filter(Boolean),
        metadata: {
          size: snapshot.size,
          empty: snapshot.empty,
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
          queryExecutedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      logger.error(`FirestoreStore.queryWithMetadata failed: ${err.message}`, { queryOptions });
      throw new Error(`FirestoreStore.queryWithMetadata failed: ${err.message}`);
    }
  }
}

export default FirestoreStore;
