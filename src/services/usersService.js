import FirebaseRealtimeStore from "../firebase/realtimeDb.js";
const userStore = new FirebaseRealtimeStore("users");

export async function readUser(id) {
  return await userStore.read(id);
}

export async function createUser(data) {
  const id = data.id || Date.now().toString();
  await userStore.create(id, data);
  return { data };
}

export async function updateUser(id, data) {
  await userStore.update(id, data);
  return { data };
}

export async function deleteUser(id) {
  await userStore.delete(id);
  return { id };
}