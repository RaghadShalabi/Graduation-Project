import { roles } from "../../middleware/auth.js";

export const endPoint = {
    getAllVictims: [roles.RescueTeam],
    getSosVictims: [roles.RescueTeam],
    updateVictimRescueStatus: [roles.RescueTeam],
    viewMap: [roles.RescueTeam],
    deleteDeadVictims: [roles.RescueTeam],
    updatePassword: [roles.RescueTeam],
    updateRescueTeamInfo: [roles.RescueTeam]
};
