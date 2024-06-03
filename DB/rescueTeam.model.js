import { Schema, model } from 'mongoose'

const rescueTeamsSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    previousPasswords: {
        type: [String],
        default: []
    },
    confirmEmail: {
        type: Boolean,
        default: false,
    },
    city: {
        type: String,
        required: true,
    },
    sendCode: {
        type: String,
        default: null,
    },
    acceptedSuperAdmin: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ["RescueTeam", "SuperAdmin"],
        default: "RescueTeam"
    },
    changePasswordTime: {
        type: Date,
    },
}, {
    timestamps: true,
});

const rescueTeamsModel = model('RescueTeams', rescueTeamsSchema)

export default rescueTeamsModel;
