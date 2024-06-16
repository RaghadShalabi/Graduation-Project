import { Schema, model } from "mongoose";

const victimSchema = new Schema(
  {
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
      default: [],
    },
    confirmEmail: {
      type: Boolean,
      default: false,
    },
    contactsEmail: {
      type: Array,
    },
    message: {
      type: String,
    },
    location: {
      type: Object,
      default: null,
    },
    city: {
      type: String,
      required: true,
    },
    heartRate: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["danger", "safe", "inProgress"],
      default: "safe",
    },
    isVictim: { type: Boolean, default: false },
    role: { type: String, default: "Victim" },
    sendCode: {
      type: String,
      default: null,
    },
    changePasswordTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const victimModel = model("Victim", victimSchema);

export default victimModel;

