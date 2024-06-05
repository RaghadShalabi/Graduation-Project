import rescueTeamsModel from "../../../../DB/rescueTeam.model.js";
import victimModel from "../../../../DB/victim.model.js";
import bcrypt from "bcryptjs";
import sendEmail from "../../../services/sendEmail.js";

// Function to get all RescueTeams needing approval
export const getPendingRescueTeams = async (req, res, next) => {
  // Check if the requesting user is a SuperAdmin
  if (req.user.role !== 'SuperAdmin') {
    return next(new Error("Access denied. Only SuperAdmins can access this resource.", { cause: 403 }));
  }

  // Find all RescueTeams where acceptedAdmin is false
  const pendingRescueTeams = await rescueTeamsModel.find({ acceptedAdmin: false });

  // If no pending rescue teams found
  if (pendingRescueTeams.length === 0) {
    return res.status(200).json({ message: "No pending RescueTeams found." });
  }

  // Return the list of pending rescue teams
  return res.status(200).json({ message: "Success", pendingRescueTeams });
};


// Function for SuperAdmin to approve a RescueTeam
export const approveRescueTeam = async (req, res, next) => {
  const { rescueTeamId } = req.params;

  const superAdmin = await rescueTeamsModel.findById(req.user._id);
  if (superAdmin.role !== "SuperAdmin") {
    return next(
      new Error("Only SuperAdmins can approve RescueTeams", { cause: 403 })
    );
  }

  const rescueTeam = await rescueTeamsModel.findById(rescueTeamId);
  if (!rescueTeam) {
    return next(new Error("RescueTeam not found", { cause: 404 }));
  }

  rescueTeam.acceptedAdmin = true;
  await rescueTeam.save();

  // Send approval email to the RescueTeam
  const html = `<div>
      <h2>Approval Notification</h2>
      <p>Hi ${rescueTeam.name},</b><br>
      Your account has been approved by a SuperAdmin. You can now sign in and start using the system.</p>
  </div>`;

  await sendEmail(rescueTeam.email, 'Account Approved', html);

  return res
    .status(200)
    .json({ message: "RescueTeam approved successfully", rescueTeam });
};


// Function to get rescue team's information by _id in token
export const getRescueTeamInfo = async (req, res, next) => {
  // Find the rescue team by ID from the token
  const rescueTeam = await rescueTeamsModel.findById(req.user._id);
  if (!rescueTeam) {
    return next(new Error("Rescue team not found", { cause: 404 }));
  }

  // Return the rescue team's information
  return res.status(200).json({ message: "Success", rescueTeam });
};

export const getAllVictims = async (req, res, next) => {
  // Find the rescue team by ID
  const rescueTeam = await rescueTeamsModel.findById(req.user._id);
  if (!rescueTeam) {
    return next(new Error("Rescue team not found", { cause: 404 }));
  }

  // Find victims in the same city as the rescue team and select specific fields
  let victims = await victimModel
    .find({ city: rescueTeam.city })
    .select("name city location heartRate");

  if (victims.length === 0) {
    return res.status(200).json({ message: "No victims found in this city" });
  }

  return res.status(200).json({ message: "success", victims });
};

export const getSosVictims = async (req, res, next) => {
  // Find the rescue team by ID
  const rescueTeam = await rescueTeamsModel.findById(req.user._id);
  if (!rescueTeam) {
    return next(new Error("Rescue team not found", { cause: 404 }));
  }

  // Find unRescued victims who have pressed the SOS button in the same city as the rescue team
  // Select specific fields to return
  const victims = await victimModel
    .find({ city: rescueTeam.city, rescueStatus: false, sosStatus: true })
    .select("name city location heartRate rescueStatus");

  // If no victims are found, return a message indicating this
  if (victims.length === 0) {
    return res
      .status(200)
      .json({ message: "No unRescued victims found in this city" });
  }

  // Sort unRescued victims by heart rate and timestamp
  victims.sort((a, b) => {
    // Prioritize victims with heart rate below 60
    if (a.heartRate < 60 && b.heartRate >= 60) {
      return -1;
    } else if (a.heartRate >= 60 && b.heartRate < 60) {
      return 1;
    }
    // Prioritize victims with heart rate above 100
    else if (a.heartRate > 100 && b.heartRate <= 100) {
      return -1;
    } else if (a.heartRate <= 100 && b.heartRate > 100) {
      return 1;
    }
    // Sort by timestamp if heart rate is same
    else {
      return b.createdAt - a.createdAt;
    }
  });

  return res.status(200).json({ message: "success", victims });
};

export const updateVictimRescueStatus = async (req, res, next) => {
  const { victimId } = req.params;
  const { rescueStatus } = req.body;

  // Check if the rescue team exists
  const rescueTeam = await rescueTeamsModel.findById(req.user._id);
  if (!rescueTeam) {
    return next(new Error("Rescue team not found", { cause: 404 }));
  }
  // Find the victim
  const victim = await victimModel
    .findById(victimId)
    .select("name city location heartRate rescueStatus -_id");
  if (!victim) {
    return next(new Error("Victim not found", { cause: 404 }));
  }

  // Update victim's rescue status
  victim.rescueStatus = rescueStatus;
  await victim.save();

  res
    .status(200)
    .json({ message: "Rescue status updated successfully", victim });
};

export const viewMap = async (req, res, next) => {
  // Find the rescue team by ID
  const rescueTeam = await rescueTeamsModel.findById(req.user._id);
  if (!rescueTeam) {
    return next(new Error("Rescue team not found", { cause: 404 }));
  }

  // Find all victims in the same city as the rescue team
  const victims = await victimModel.find({
    city: rescueTeam.city,
    sosStatus: true,
  });

  // If no victims are found, return a message indicating this
  if (victims.length === 0) {
    return res.status(200).json({ message: "No victims found in this city" });
  }

  // Extract location of all victims
  const locations = victims.map((victim) => victim.location);

  return res.status(200).json({ message: "success", locations });
};

export const deleteDeadVictims = async (req, res, next) => {
  // Find the rescue team by ID
  const rescueTeam = await rescueTeamsModel.findById(req.user._id);
  if (!rescueTeam) {
    return next(new Error("Rescue team not found", { cause: 404 }));
  }

  // Delete victims with heart rate equal to 0 in the same city as the rescue team
  const result = await victimModel.deleteMany({
    city: rescueTeam.city,
    heartRate: 0,
  });

  // If no dead victims are found, return a message indicating this
  if (result.deletedCount === 0) {
    return res
      .status(200)
      .json({ message: "No dead victims found in this city" });
  }

  // If victims are deleted, return a message with the count of deleted victims
  return res.status(200).json({
    message: "Dead victims deleted successfully",
    deletedCount: result.deletedCount,
  });
};

// Function to update rescue team's information
export const updateRescueTeamInfo = async (req, res, next) => {
  // Extract new values from the request body
  const { name, city } = req.body;

  // Find the rescue team by ID
  const rescueTeam = await rescueTeamsModel.findById(req.user._id);
  if (!rescueTeam) {
    return next(new Error("Rescue team not found", { cause: 404 }));
  }

  // Update the rescue team's information
  if (name) rescueTeam.name = name;
  if (city) rescueTeam.city = city;

  // Save the updated rescue team
  await rescueTeam.save();

  // Return a success response
  return res.status(200).json({
    message: "rescue team user information updated successfully",
    rescueTeam,
  });
};

// Function to update the password of a rescue team member
export const updatePassword = async (req, res, next) => {
  // Extract old and new passwords from the request body
  const { oldPassword, newPassword, cNewPassword } = req.body;

  // Check if newPassword matches cNewPassword
  if (newPassword !== cNewPassword) {
    return next(
      new Error("New password and confirm new password do not match", {
        cause: 400,
      })
    );
  }

  // Find the rescue team member by ID from the request user object
  const rescueTeam = await rescueTeamsModel.findById(req.user._id);

  // Check if the old password matches the current password stored in the database
  const match = bcrypt.compareSync(oldPassword, rescueTeam.password);
  if (!match) {
    // If the old password does not match, return an error
    return next(new Error("Invalid old password", { cause: 404 }));
  }

  // Check if the new password is the same as the old password
  const matchOldNew = bcrypt.compareSync(newPassword, rescueTeam.password);
  if (matchOldNew) {
    // If the new password is the same as the old password, return an error
    return next(
      new Error("New password must be different from the old password", {
        cause: 409,
      })
    );
  }

  // Check if the new password has been used before
  const previousPasswords = rescueTeam.previousPasswords || [];
  const isPasswordUsedBefore = previousPasswords.some((hash) =>
    bcrypt.compareSync(newPassword, hash)
  );
  if (isPasswordUsedBefore) {
    return next(
      new Error(
        "New password must be different from previously used passwords",
        { cause: 409 }
      )
    );
  }

  // Hash the new password
  const hashNewPassword = bcrypt.hashSync(
    newPassword,
    parseInt(process.env.SALT_ROUND)
  );

  // Update the password and store the old password in the previousPasswords array
  previousPasswords.push(rescueTeam.password);
  await rescueTeamsModel.updateOne(
    { _id: req.user._id },
    { password: hashNewPassword, previousPasswords }
  );

  // Return a success response
  return res.status(201).json({
    message: "The password has been updated successfully",
    rescueTeam,
  });
};
