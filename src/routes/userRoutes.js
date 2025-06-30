import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validationMiddleware.js';
import FirestoreStore from '../stores/FirestoreStore.js';
import FirebaseRealtimeStore from '../stores/RealtimeStore.js';
import { ROLES } from '../config/rolesConfig.js';
import getLogger from '../config/loggerConfig.js';
import {
  firstResponderSchema,
  volunteerSchema,
  locationUpdateSchema,
} from '../validation/userSchemas.js';

const router = express.Router();
const logger = getLogger();

const firstRespondersStore = new FirestoreStore('firstResponders');
const volunteersStore = new FirestoreStore('volunteers');
const locationsStore = new FirebaseRealtimeStore('userLocations');

router.post(
  '/first-responders',
  authMiddleware([ROLES.FIRST_RESPONDER]),
  validateRequest(firstResponderSchema),
  async (req, res) => {
    const { userId, name, skills, contact } = req.body;
    const createdAt = new Date().toISOString();
    try {
      await firstRespondersStore.create(userId, {
        name,
        skills,
        contact,
        createdAt,
      });
      res.status(201).json({ userId, createdAt });
    } catch (err) {
      logger.error('create first responder failed', {
        userId,
        err: err.message,
      });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.post(
  '/volunteers',
  authMiddleware([ROLES.VOLUNTEER]),
  validateRequest(volunteerSchema),
  async (req, res) => {
    const { userId, name, skills, contact } = req.body;
    const createdAt = new Date().toISOString();
    try {
      await volunteersStore.create(userId, {
        name,
        skills,
        contact,
        createdAt,
      });
      res.status(201).json({ userId, createdAt });
    } catch (err) {
      logger.error('create volunteer failed', { userId, err: err.message });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.put(
  '/:userId/location',
  authMiddleware([ROLES.VOLUNTEER, ROLES.FIRST_RESPONDER]),
  validateRequest(locationUpdateSchema),
  async (req, res) => {
    const { userId } = req.params;
    const { lat, lng, timestamp } = req.body;
    try {
      await locationsStore.update(userId, { lat, lng, timestamp });
      res.json({ status: 'ok' });
    } catch (err) {
      logger.error('update location failed', { userId, err: err.message });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
