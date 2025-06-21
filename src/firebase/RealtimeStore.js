import db from "../config/firebaseConfig.js";

class FirebaseRealtimeStore {
  constructor(basePath) {
    if (!basePath) throw new Error("Missing Details. Required 'basePath'.");
    this.basePath = basePath;
  }

  buildRef(id) {
    return db.ref(`${this.basePath}/${id}`);
  }

  async create(id, data) {
    const ref = this.buildRef(id);
    try {
      await ref.set(data);
      return { id, ...data };
    } catch (error) {
      throw new Error(`Firebase Realtime Store Create Failed: ${error.message}`);
    }
  }

  async update(id, data) {
    const ref = this.buildRef(id);
    try {
      await ref.update(data);
      return { id, ...data };
    } catch (error) {
      throw new Error(`Firebase Realtime Store Update Failed: ${error.message}`);
    }
  }

  async delete(id) {
    const ref = this.buildRef(id);
    try {
      await ref.remove();
      return { id };
    } catch (error) {
      throw new Error(`Firebase Realtime Store Delete Failed: ${error.message}`);
    }
  }

  async read(id) {
    const ref = this.buildRef(id);
    try {
      const snapshot = await ref.once("value");
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      throw new Error(`Firebase Realtime Store Read Failed: ${error.message}`);
    }
  }
}

export default FirebaseRealtimeStore;
