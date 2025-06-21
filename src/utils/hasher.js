import { hashAlgorithm, hashEncoder } from '../config/hashConfig.js';
import crypto from 'crypto';
const getHash = (str) => {
  return crypto.createHash(hashAlgorithm).update(str).digest(hashEncoder);
};
export default getHash;
