import { Router } from 'express';
import {
    createProject,
    getActiveProjects,
    getAllProjects,
    updateProject,
    deleteProject
} from '../controllers/project.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public route
router.route('/active').get(getActiveProjects);

// Protected Admin Routes
router.use(authenticate);
router.use(checkRole(['super-admin', 'media-lead'])); // Media Lead & Super Admin can manage projects

router.route('/')
    .post(createProject)
    .get(getAllProjects);

router.route('/:id')
    .put(updateProject)
    .delete(deleteProject);

export default router;
