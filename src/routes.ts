import {Router, Request, Response} from 'express';
import { createApplication, 
    getAllApplications, 
    getApplicationById,
    updateApplicationById,
    deleteApplicationById } from './controllers/applicationController';

const router: Router = Router();

//get, post, put, delete (CRUD)


router.get('/', (req: Request, res: Response) => {

    res.status(200).send('Welcome to PLYO');
});

router.post('/applications', createApplication);
router.get('/applications', getAllApplications);
router.get('/applications/:id', getApplicationById);
router.put('/applications/:id', updateApplicationById);
router.delete('/applications/:id', deleteApplicationById);

export default router;
