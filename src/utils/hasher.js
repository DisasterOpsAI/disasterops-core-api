import { hashEncoder } from '../config/hashConfig.js';
import crypto from 'crypto';
const getHash = (str) => {
  return crypto.createHash('sha256').update(str).digest(hashEncoder);
};
export default getHash;
