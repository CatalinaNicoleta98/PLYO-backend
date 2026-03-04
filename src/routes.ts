import {Router, Request, Response} from 'express';
import { createApplication, getAllApplications, getApplicationById } from './controllers/applicationController';

const router: Router = Router();

//get, post, put, delete (CRUD)


router.get('/', (req: Request, res: Response) => {

    res.status(200).send('Welcome to PLYO');
});

router.post('/applications', createApplication);
router.get('/applications', getAllApplications);
router.get('/applications/:id', getApplicationById);

export default router;
