import Router from "express";
const router = Router();
import * as rescueTeamController from "./controller/rescueTeam.controller.js";
import { endPoint } from "../rescueTeam/rescueTeam.endpoint.js";
import { auth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandling.js";
import fileUpload, { fileValidation } from "../../services/multer.js";

router.get(
  "/pendingRescueTeams",
  auth(endPoint.getPendingRescueTeams),
  asyncHandler(rescueTeamController.getPendingRescueTeams)
);
router.put(
  "/approveRescueTeam/:rescueTeamId",
  auth(endPoint.approveRescueTeam),
  asyncHandler(rescueTeamController.approveRescueTeam)
);
router.delete(
  "/deleteRescueTeam/:rescueTeamId",
  auth(endPoint.deleteRescueTeam),
  asyncHandler(rescueTeamController.deleteRescueTeam)
);
router.get(
  "/info",
  auth(endPoint.getRescueTeamInfo),
  asyncHandler(rescueTeamController.getRescueTeamInfo)
);
router.get(
  "/getAllRescueTeamProfiles",
  auth(endPoint.getAllRescueTeamProfiles),
  asyncHandler(rescueTeamController.getAllRescueTeamProfiles)
);
router.get(
  "/rescueTeamProfile/:id",
  auth(endPoint.getRescueTeamProfileById),
  asyncHandler(rescueTeamController.getRescueTeamProfileById)
);
router.delete(
  "/deleteRescueTeam/:id",
  auth(endPoint.deleteRescueTeamById),
  asyncHandler(rescueTeamController.deleteRescueTeamById)
);
router.get(
  "/allVictims",
  auth(endPoint.getAllVictims),
  asyncHandler(rescueTeamController.getAllVictims)
);
router.get(
  "/sosVictims",
  auth(endPoint.getSosVictims),
  asyncHandler(rescueTeamController.getSosVictims)
);
router.put(
  "/victims/:victimId/updateRescueStatus",
  auth(endPoint.updateVictimRescueStatus),
  asyncHandler(rescueTeamController.updateVictimRescueStatus)
);
router.get(
  "/viewMap",
  auth(endPoint.viewMap),
  asyncHandler(rescueTeamController.viewMap)
);
router.delete(
  "/deadVictims",
  auth(endPoint.deleteDeadVictims),
  asyncHandler(rescueTeamController.deleteDeadVictims)
);
router.patch(
  "/updatePassword",
  auth(endPoint.updatePassword),
  asyncHandler(rescueTeamController.updatePassword)
);
router.put(
  "/updateInfo",
  fileUpload(fileValidation.image).single("image"),
  auth(endPoint.updateRescueTeamInfo),
  asyncHandler(rescueTeamController.updateRescueTeamInfo)
);

export default router;
