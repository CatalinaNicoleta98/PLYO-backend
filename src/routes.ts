import {Router, Request, Response} from 'express';
import { createApplication, 
    getAllApplications, 
    getApplicationById,
    updateApplicationById,
    deleteApplicationById } from './controllers/applicationController';

import { registerUser, loginUser, verifyToken } from './controllers/authController';

const router: Router = Router();

//get, post, put, delete (CRUD)


router.get('/', (req: Request, res: Response) => {

    res.status(200).send('Welcome to PLYO');
});

//CRUD for applications
router.post('/applications', createApplication);
router.get('/applications', getAllApplications);
router.get('/applications/:id', getApplicationById);
router.put('/applications/:id',verifyToken, updateApplicationById);
router.delete('/applications/:id', verifyToken, deleteApplicationById);

//Authentication routes
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);

export default router;
