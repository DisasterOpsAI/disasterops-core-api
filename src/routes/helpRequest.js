import {
  createRequestSchema,
  updateRequestSchema,
} from '../validation/requestSchemas.js';
import { Router } from 'express';
import getLogger from '../config/loggerConfig.js';
import FirestoreStore from '../firebase/FirestoreStore.js';
import StorageStore from '../firebase/StorageStore.js';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { firestoreDB } from '../config/firebaseConfig.js';
import admin from 'firebase-admin';

const router = Router();
const logger = getLogger();
const store = new FirestoreStore('help-requests');
const requestsCol = firestoreDB.collection('help-requests');
router.use(authMiddleware());

router.post('/', validate(createRequestSchema), async (req, res) => {
  try {
    const { name, contactInfo, location, description, attachments } = req.body;

    const requestId = `req-${uuidv4()}`;
    const chatRoomId = `room-${uuidv4()}`;

    const newReq = {
      requestId,
      chatRoomId,
      name,
      contactInfo,
      location,
      description,
      attachments: [],
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      history: [],
    };

    const result = await store.create(requestId, newReq);
    if (typeof result === 'string') {
      return res.status(500).json({ error: result });
    }

    if (attachments && attachments.length > 0) {
      const storageStore = new StorageStore(`help-requests/${requestId}`);
      const attachmentDetails = [];

      for (const attachment of attachments) {
        const fileBuffer = Buffer.from(attachment.data, 'base64');
        const attachmentDetail = await storageStore.create({
          fileName: attachment.name,
          fileBuffer,
        });
        attachmentDetails.push(attachmentDetail);
      }

      await store.update(requestId, { attachments: attachmentDetails });
    }

    return res.status(201).json({ requestId, chatRoomId });
  } catch (error) {
    logger.error('Error creating request', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const snapshot = await requestsCol.get();
    const summary = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        requestId: data.requestId,
        description: data.description,
        status: data.status,
        attachments: data.attachments,
        createdAt: data.createdAt,
      };
    });
    res.json(summary);
  } catch (error) {
    logger.error('Error fetching requests', {
      error: error.message,
      stack: error.stack,
      path: _req.path,
      method: _req.method,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:requestId', validate(updateRequestSchema), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { additionalInfo, newAttachments } = req.body;
    const exists = await store.read(requestId);

    if (!exists) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const updates = {};
    if (additionalInfo) {
      const history = Array.isArray(exists.history) ? exists.history : [];
      history.push({ type: 'update', data: { additionalInfo } });
      updates.history = history;
    }

    const attachmentsToAdd = Array.isArray(newAttachments)
      ? newAttachments
      : [];
    if (attachmentsToAdd.length) {
      updates.attachments = [
        ...(Array.isArray(exists.attachments) ? exists.attachments : []),
        ...attachmentsToAdd,
      ];
    }
    updates.updatedAt = new Date().toISOString();

    const result = await store.update(requestId, updates);
    if (typeof result === 'string') {
      return res.status(500).json({ error: result });
    }
    return res.json({ requestId, updatedAt: updates.updatedAt });
  } catch (error) {
    logger.error(`Error updating request ${req.params.requestId}`, {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
