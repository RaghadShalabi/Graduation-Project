import { roles } from "../../middleware/auth.js";

export const endPoint = {
  getPendingRescueTeams: [roles.SuperAdmin],
  approveRescueTeam: [roles.SuperAdmin],
  deleteRescueTeam: [roles.SuperAdmin],
  getRescueTeamInfo: [roles.RescueTeam, roles.SuperAdmin],
  getAllVictims: [roles.RescueTeam, roles.SuperAdmin],
  getSosVictims: [roles.RescueTeam, roles.SuperAdmin],
  updateVictimRescueStatus: [roles.RescueTeam, roles.SuperAdmin],
  viewMap: [roles.RescueTeam, roles.SuperAdmin],
  deleteDeadVictims: [roles.RescueTeam, roles.SuperAdmin],
  updatePassword: [roles.RescueTeam, roles.SuperAdmin],
  updateRescueTeamInfo: [roles.RescueTeam, roles.SuperAdmin],
  deleteRescueTeamAccount : [roles.RescueTeam],
};
