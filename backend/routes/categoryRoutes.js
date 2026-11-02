import express from 'express';
import { getCategories } from '../controllers/schemeController.js';

const router = express.Router();

// GET /api/categories
router.get('/', getCategories);

export default router;
