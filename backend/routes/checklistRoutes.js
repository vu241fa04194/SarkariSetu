import express from 'express';
import {
  getSchemeChecklist,
  saveSchemeChecklist,
  toggleChecklistItem,
  resetSchemeChecklist,
  getMyChecklists,
} from '../controllers/checklistController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Guest accessible with optional user enrichment
router.get('/scheme/:schemeId', optionalProtect, getSchemeChecklist);

// Authenticated Citizen Routes
router.use(protect);

router.get('/', getMyChecklists);
router.post('/scheme/:schemeId', saveSchemeChecklist);
router.patch('/scheme/:schemeId/item', toggleChecklistItem);
router.delete('/scheme/:schemeId', resetSchemeChecklist);

export default router;
