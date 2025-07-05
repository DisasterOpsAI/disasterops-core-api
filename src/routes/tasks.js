import {
  createTaskSchema,
  updateTaskSchema,
} from '../validation/requestSchemas.js';
import { Router } from 'express';
import getLogger from '../config/loggerConfig.js';
import FirestoreStore from '../firebase/FirestoreStore.js';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { firestoreDB } from '../config/firebaseConfig.js';
import admin from 'firebase-admin';

const router = Router();
const logger = getLogger();
const taskStore = new FirestoreStore('tasks');
const tasksCol = firestoreDB.collection('tasks');
router.use(authMiddleware());

router.post('/', validate(createTaskSchema), async (req, res) => {
  try {
    const { requestId, assigneeId, resourceAllocations } = req.body;

    const taskId = `task-${uuidv4()}`;

    const newTask = {
      taskId,
      requestId,
      assigneeId,
      resourceAllocations,
      status: 'pending',
      notes: '',
      attachments: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const result = await taskStore.create(taskId, newTask);
    if (typeof result === 'string') {
      return res.status(500).json({ error: result });
    }

    return res.status(201).json({ 
      taskId, 
      createdAt: new Date().toISOString() 
    });
  } catch (error) {
    logger.error('Error creating task', {
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
    const snapshot = await tasksCol.get();
    const tasks = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        taskId: data.taskId,
        requestId: data.requestId,
        status: data.status,
        createdAt: data.createdAt,
      };
    });
    res.json(tasks);
  } catch (error) {
    logger.error('Error fetching tasks', {
      error: error.message,
      stack: error.stack,
      path: _req.path,
      method: _req.method,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskStore.read(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (typeof task === 'string') {
      return res.status(500).json({ error: task });
    }

    const taskDetail = {
      taskId: task.taskId,
      requestId: task.requestId,
      status: task.status,
      notes: task.notes,
      attachments: task.attachments,
      assignedResponder: task.assigneeId,
      createdAt: task.createdAt,
    };

    res.json(taskDetail);
  } catch (error) {
    logger.error(`Error fetching task ${req.params.taskId}`, {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:taskId', validate(updateTaskSchema), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes, attachments } = req.body;
    
    const exists = await taskStore.read(taskId);
    if (!exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (typeof exists === 'string') {
      return res.status(500).json({ error: exists });
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (attachments !== undefined) updates.attachments = attachments;
    
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    const result = await taskStore.update(taskId, updates);
    if (typeof result === 'string') {
      return res.status(500).json({ error: result });
    }

    return res.json({ 
      taskId, 
      updatedAt: new Date().toISOString() 
    });
  } catch (error) {
    logger.error(`Error updating task ${req.params.taskId}`, {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;