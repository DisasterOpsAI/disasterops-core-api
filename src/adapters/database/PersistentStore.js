class PersistentStore {
  async create(id, data) {
    throw new Error('Method "create" must be implemented');
  }
  async read(id) {
    throw new Error('Method "read" must be implemented');
  }
  async update(id, data) {
    throw new Error('Method "update" must be implemented');
  }
  async delete(id) {
    throw new Error('Method "delete" must be implemented');
  }
}

export default PersistentStore;
