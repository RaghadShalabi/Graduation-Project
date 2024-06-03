import Router from 'express'
const router = Router()
import * as rescueTeamController from "./controller/rescueTeam.controller.js"
import { endPoint } from '../rescueTeam/rescueTeam.endpoint.js';
import { auth } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandling.js';


router.get('/allVictims', auth(endPoint.getAllVictims), asyncHandler(rescueTeamController.getAllVictims));
router.get('/sosVictims', auth(endPoint.getSosVictims), asyncHandler(rescueTeamController.getSosVictims))
router.put('/victims/:victimId/updateRescueStatus', auth(endPoint.updateVictimRescueStatus), asyncHandler(rescueTeamController.updateVictimRescueStatus));
router.get('/viewMap', auth(endPoint.viewMap), asyncHandler(rescueTeamController.viewMap));
router.delete('/deadVictims', auth(endPoint.deleteDeadVictims), asyncHandler(rescueTeamController.deleteDeadVictims))
router.patch('/updatePassword', auth(endPoint.updatePassword), asyncHandler(rescueTeamController.updatePassword))
router.put('/updateInfo', auth(endPoint.updateRescueTeamInfo), asyncHandler(rescueTeamController.updateRescueTeamInfo));

export default router;