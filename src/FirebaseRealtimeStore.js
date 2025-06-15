import admin from "firebase-admin";
import serviceAccount from "./firebaseServiceAccountKey.js";
import RealtimeStore from "./RealtimeStore.js";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://disaster-ops-api-default-rtdb.firebaseio.com/"
});

const db = admin.database();

class FirebaseRealtimeStore extends RealtimeStore {
  async create(path, data) {
    try {
      await db.ref(path).set(data);
    } catch (error) {
      throw new Error("Firebase Create Failed: " + error.message);
    }
  }

  async update(path, data) {
    try {
      await db.ref(path).update(data);
    } catch (error) {
      throw new Error("Firebase Update Failed: " + error.message);
    }
  }

  async delete(path) {
    try {
      await db.ref(path).remove();
    } catch (error) {
      throw new Error("Firebase Delete Failed: " + error.message);
    }
  }

  async read(path) {
    try {
      const snapshot = await db.ref(path).once("value");
      return snapshot.val();
    } catch (error) {
      throw new Error("Firebase Read Failed: " + error.message);
    }
  }
}

export default FirebaseRealtimeStore;
