import { Router } from 'express';
import {
    getAllAlbums,
    getAlbumById,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    addImagesToAlbum,
    removeImageFromAlbum
} from '../controllers/album.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();


router.get('/', getAllAlbums);
router.get('/:id', getAlbumById);


router.use(
    authenticate,
    checkRole(['super-admin', 'media-lead'])
);

router.post('/', createAlbum);
router.put('/:id', updateAlbum);
router.delete('/:id', deleteAlbum);
router.post('/:id/images', addImagesToAlbum);
router.delete('/:id/images/:imageId', removeImageFromAlbum);

export default router;