import {Router, Request, Response} from 'express';
import {
    createDocument,
    getAllDocuments,
    getDocumentById,
    updateDocumentById,
    deleteDocumentById,
} from './controllers/documentController';
import {
    createApplication,
    getAllApplications,
    getApplicationById,
    updateApplicationById,
    deleteApplicationById,
    upload,
    uploadApplicationDocument,
    deleteApplicationDocument,
} from './controllers/applicationController';

import { registerUser, loginUser, verifyToken, updateUsername, deleteAccount } from './controllers/authController';

const router: Router = Router();

//get, post, put, delete (CRUD)


router.get('/', (req: Request, res: Response) => {

    res.status(200).send('Welcome to PLYO');
});

//CRUD for applications
router.post('/applications', verifyToken, createApplication);
router.get('/applications', verifyToken, getAllApplications);
router.get('/applications/:id', verifyToken, getApplicationById);
router.put('/applications/:id', verifyToken, updateApplicationById);
router.delete('/applications/:id', verifyToken, deleteApplicationById);
router.post('/applications/:id/upload', verifyToken, upload.single('file'), uploadApplicationDocument);
router.delete('/applications/:id/documents/:fileName', verifyToken, deleteApplicationDocument);

//CRUD for documents
router.post('/documents', verifyToken, createDocument);
router.get('/documents', verifyToken, getAllDocuments);
router.get('/documents/:id', verifyToken, getDocumentById);
router.put('/documents/:id', verifyToken, updateDocumentById);
router.delete('/documents/:id', verifyToken, deleteDocumentById);

//Authentication routes
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.patch('/auth/username', verifyToken, updateUsername);
router.delete('/auth/account', verifyToken, deleteAccount);

export default router;
