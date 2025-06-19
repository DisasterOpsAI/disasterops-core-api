import RealtimeStore from "./RealtimeStore.js";
import db from "../../config/firebase.js";

class FirebaseRealtimeStore extends RealtimeStore {
  constructor(folder = "", info = {}) {
    super();
    this.folder = folder;
    this.info = info;
  }

  makePath(path) {
    return this.folder ? `${this.folder}/${path}` : path;
  }

  async create(path, data) {
    try {
      await db.ref(this.makePath(path)).set(data);
      return true;
    } catch (error) {
      throw new Error(`Firebase Realtime Store Create Failed: ${error.message}`);
    }
  }

  async update(path, data) {
    try {
      await db.ref(this.makePath(path)).update(data);
      return true;
    } catch (error) {
      throw new Error(`Firebase Realtime Store Update Failed: ${error.message}`);
    }
  }

  async delete(path) {
    try {
      await db.ref(this.makePath(path)).remove();
      return true;
    } catch (error) {
      throw new Error(`Firebase Realtime Store Delete Failed: ${error.message}`);
    }
  }

  async read(path) {
    try {
      const snapshot = await db.ref(this.makePath(path)).once("value");
      return snapshot.val();
    } catch (error) {
      throw new Error(`Firebase Realtime Store Read Failed: ${error.message}`);
    }
  }
}

export default FirebaseRealtimeStore;
