import { Router } from 'express';
import {
  listVault, getVaultItem, createVaultItem, updateVaultItem, deleteVaultItem,
} from '../controllers/vault.controller.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(protect);
router.route('/').get(listVault).post(upload.single('file'), createVaultItem);
router
  .route('/:id')
  .get(getVaultItem)
  .put(upload.single('file'), updateVaultItem)
  .delete(deleteVaultItem);

export default router;
