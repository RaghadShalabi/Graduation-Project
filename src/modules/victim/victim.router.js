import Router from 'express'
const router = Router()
import * as victimController from "./controller/victim.controller.js"
import { auth } from '../../middleware/auth.js';
import { endPoint } from './victim.endpoint.js';
import { asyncHandler } from '../../middleware/errorHandling.js';

router.get('/info', auth(endPoint.getVictimInfo), asyncHandler(victimController.getVictimInfo));
router.post('/setEmergencyContacts', auth(endPoint.setEmergencyContacts), asyncHandler(victimController.setEmergencyContacts));
router.post('/setEmergencyMessage', auth(endPoint.setEmergencyMessage), asyncHandler(victimController.setEmergencyMessage));
router.post('/setHeartAndLocation', auth(endPoint.setHeartAndLocation), asyncHandler(victimController.setHeartAndLocation));
router.post('/sendSOSMessage', auth(endPoint.sendSOSMessage), asyncHandler(victimController.sendSOSMessage));
router.patch('/updatePassword', auth(endPoint.updatePassword), asyncHandler(victimController.updatePassword))
router.put('/updateInfo', auth(endPoint.updateVictimInfo), asyncHandler(victimController.updateVictimInfo));


export default router;



