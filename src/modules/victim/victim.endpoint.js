import { roles } from "../../middleware/auth.js";

export const endPoint = {
    getAll: [roles.Victim],
    setEmergencyContacts: [roles.Victim],
    setEmergencyMessage: [roles.Victim],
    setHeartAndLocation: [roles.Victim],
    sendSOSMessage:[roles.Victim],
    updatePassword:[roles.Victim],
    updateVictimInfo: [roles.Victim]
};
