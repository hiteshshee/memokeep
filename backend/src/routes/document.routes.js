import { Router } from 'express';
import {
  uploadDocument,
  listDocuments,
  deleteDocument,
} from '../controllers/document.controller.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(protect);
router.route('/').get(listDocuments).post(upload.single('file'), uploadDocument);
router.delete('/:id', deleteDocument);

export default router;
