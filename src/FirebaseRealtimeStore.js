import db from "./config/firebase.js";
import RealtimeStore from "./RealtimeStore.js";

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
      console.error("Firebase Realtime Store Create Failed:", error.message);
      return false;
    }
  }

  async update(path, data) {
    try {
      await db.ref(this.makePath(path)).update(data);
      return true;
    } catch (error) {
      console.error("Firebase Realtime Store Update Failed:", error.message);
      return false;
    }
  }

  async delete(path) {
    try {
      await db.ref(this.makePath(path)).remove();
      return true;
    } catch (error) {
      console.error("Firebase Realtime Store Delete Failed:", error.message);
      return false;
    }
  }

  async read(path) {
    try {
      const snapshot = await db.ref(this.makePath(path)).once("value");
      return snapshot.val();
    } catch (error) {
      console.error("Firebase Realtime Store Read Failed:", error.message);
      return null;
    }
  }
}

export default FirebaseRealtimeStore;
