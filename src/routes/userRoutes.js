import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validationMiddleware.js';
import FirestoreStore from '../stores/FirestoreStore.js';
import FirebaseRealtimeStore from '../stores/RealtimeStore.js';
import { ROLES } from '../config/rolesConfig.js';
import getLogger from '../config/loggerConfig.js';
import {
  initialFirstResponderCreationSchema,
  initialVolunteerCreationSchema,
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
  validateRequest(initialFirstResponderCreationSchema),
  async (req, res) => {
    const userId = res.locals.uid;
    const { name, skills, contact } = req.body;

    try {
      const result = await firstRespondersStore.create(userId, {
        name,
        skills,
        contact,
      });
      const createdAt = result.createdAt.toDate().toISOString();
      return res.status(201).json({ userId, createdAt });
    } catch (err) {
      logger.error('Create first responder failed', {
        userId,
        err: err.message,
      });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.post(
  '/volunteers',
  authMiddleware([ROLES.VOLUNTEER]),
  validateRequest(initialVolunteerCreationSchema),
  async (req, res) => {
    const userId = res.locals.uid;
    const { name, skills, contact } = req.body;

    try {
      const result = await volunteersStore.create(userId, {
        name,
        skills,
        contact,
      });
      const createdAt = result.createdAt.toDate().toISOString();
      return res.status(201).json({ userId, createdAt });
    } catch (err) {
      logger.error('Create volunteer failed', { userId, err: err.message });
      return res.status(500).json({ error: 'Internal Server Error' });
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

    if (res.locals.uid !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own location',
      });
    }

    try {
      await locationsStore.update(userId, { lat, lng, timestamp });
      return res.json({ status: 'ok' });
    } catch (err) {
      logger.error('Update location failed', { userId, err: err.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.get(
  '/first-responders/:userId',
  authMiddleware([ROLES.FIRST_RESPONDER]),
  async (req, res) => {
    const { userId } = req.params;
    try {
      const profile = await firstRespondersStore.read(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Not Found' });
      }
      return res.json(profile);
    } catch (err) {
      logger.error('Read first responder failed', { userId, err: err.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.get(
  '/volunteers/:userId',
  authMiddleware([ROLES.VOLUNTEER]),
  async (req, res) => {
    const { userId } = req.params;
    try {
      const profile = await volunteersStore.read(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Not Found' });
      }
      return res.json(profile);
    } catch (err) {
      logger.error('Read volunteer failed', { userId, err: err.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.put(
  '/first-responders/:userId',
  authMiddleware([ROLES.FIRST_RESPONDER]),
  validateRequest(initialFirstResponderCreationSchema),
  async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;

    try {
      await firstRespondersStore.update(userId, updates);
      return res.json({ status: 'ok' });
    } catch (err) {
      logger.error('Update first responder failed', {
        userId,
        err: err.message,
      });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.put(
  '/volunteers/:userId',
  authMiddleware([ROLES.VOLUNTEER]),
  validateRequest(initialVolunteerCreationSchema),
  async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;

    try {
      await volunteersStore.update(userId, updates);
      return res.json({ status: 'ok' });
    } catch (err) {
      logger.error('Update volunteer failed', { userId, err: err.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// TODO: implement DELETE /first-responders/:userId and DELETE /volunteers/:userId

export default router;
