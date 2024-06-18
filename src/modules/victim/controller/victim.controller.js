import victimModel from "../../../../DB/victim.model.js";
import sendEmail from "../../../services/sendEmail.js";
import bcrypt from "bcryptjs";
import rescueTeamsModel from "../../../../DB/rescueTeam.model.js";

// Function to get victim's information by _id in token
export const getVictimInfo = async (req, res, next) => {
  // Find the victim by ID from the token
  const victim = await victimModel.findById(req.user._id);
  if (!victim) {
    return next(new Error("Victim not found", { cause: 404 }));
  }

  // Return the victim's information
  return res.status(200).json({ message: "Success", victim });
};

// Function to set emergency contacts for a victim
export const setEmergencyContacts = async (req, res, next) => {
  // Get user ID from the authenticated user
  const userId = req.user._id;

  // Get new emergency contacts from the request body
  const { contactsEmail } = req.body;

  // Find the victim by ID and update the emergency contacts
  const victim = await victimModel.findByIdAndUpdate(
    userId,
    { $addToSet: { contactsEmail: { $each: contactsEmail } } }, // Use $addToSet with $each to add only unique emails
    { new: true } // Return the updated document
  );

  // Check if the victim exists
  if (!victim) {
    return next(new Error("Victim not found", { cause: 404 }));
  }

  return res.status(200).json({ message: "Success", victim });
};

// Function to set an emergency message for all emergency contacts
export const setEmergencyMessage = async (req, res, next) => {
  // Get user ID from the authenticated user
  const userId = req.user._id;

  // Get the emergency message from the request body
  const { message } = req.body;

  // Find the victim by ID and update the emergency message
  const victim = await victimModel.findByIdAndUpdate(
    userId,
    { message: message },
    { new: true, runValidators: true } // Return the updated document and run schema validators
  );

  if (!victim) {
    return next(new Error("Victim not found", { cause: 404 }));
  }

  // Respond with success and the updated victim data
  return res.status(200).json({
    message: "Success",
    victim: victim,
  });
};

// Function to set heart rate and location of a victim
export const setHeartAndLocation = async (req, res, next) => {
  // Get user ID from the authenticated user
  const userId = req.user._id;

  // Destructure heartRate and location from the request body
  const { heartRate, location } = req.body;

  // Find and update the victim's document in the database
  const victim = await victimModel.findByIdAndUpdate(
    userId,
    { heartRate, location },
    { new: true } // Return the updated document
  );

  // Check if the victim exists
  if (!victim) {
    return next(new Error("Victim not found", { cause: 404 }));
  }

  // Check if the heart rate is safe or not
  if (heartRate >= 100 || heartRate <= 60) {
    victim.status = "danger";
    await victim.save();

    // Find rescue teams in the same city
    const rescueTeams = await rescueTeamsModel.find({
      city: victim.city,
      acceptedAdmin: true,
      confirmEmail: true,
    });
    const emergencyMessage = `<div>
    <h2>Urgent Alert!</h2>
<p>The victim's heart rate is in danger range. Immediate assistance is required. <br>
                                Name: ${victim.name} <br>
                                City: ${victim.city} <br>
                                HeartRate: ${heartRate} bpm <br>
                                Location: Latitude ${location.latitude}, Longitude ${location.longitude}<br>
                                Message: ${victim.message}</p>
    </div>`;

    // Sending email to each rescue team
    rescueTeams.forEach((team) => {
      sendEmail(team.email, "Urgent Alert", emergencyMessage);
    });
  } else if (heartRate < 100 && heartRate > 60) {
    victim.status = "safe";
    await victim.save();
  }

  return res.status(200).json({ message: "Success", victim });
};

// Function to send SOS message and update victim's status
export const sendSOSMessage = async (req, res, next) => {
  // Get user ID from the authenticated user
  const userId = req.user._id;

  // Retrieve the victim's details from the database
  const victim = await victimModel.findById(userId);

  // Check if the victim exists
  if (!victim) {
    return next(new Error("Victim not found", { cause: 404 }));
  }

  // Retrieve victim information from the victim's document
  const { contactsEmail, message, name, city, heartRate, location } = victim;

  // Check if there are any contacts to send the message to
  if (contactsEmail && contactsEmail.length > 0) {
    // Include victim's details in the message for contacts Email
    const messageToContactsEmail = `<div>
    <h2>Urgent SOS Alert!</h2>
<p>Your friend in danger and immediate assistance. <br>
                                Name: ${name} <br>
                                City: ${city} <br>
                                HeartRate: ${heartRate} bpm <br>
                                Location: Latitude ${location.latitude}, Longitude ${location.longitude}<br>
                                Message: ${message}</p>
    </div>`;
    // Sending email to each contact
    for (const email of contactsEmail) {
      await sendEmail(email, "SOS - Urgent", messageToContactsEmail);
    }
  }

  // Find rescue teams in the same city
  const rescueTeams = await rescueTeamsModel.find({
    city: victim.city,
    acceptedAdmin: true,
    confirmEmail: true,
  });

  // Include victim's details in the message for rescue teams
  const messageToRescueTeam = `<div>
    <h2>Urgent SOS Alert!</h2>
<p>A victim is in danger and requires immediate assistance. <br>
                                Name: ${name} <br>
                                City: ${city} <br>
                                HeartRate: ${heartRate} bpm <br>
                                Location: Latitude ${location.latitude}, Longitude ${location.longitude} <br>
                                Message: ${message}</p>
    </div>`;

  // Sending email to each rescue team
  rescueTeams.forEach((team) => {
    sendEmail(team.email, "SOS - Urgent", messageToRescueTeam);
  });

  // Update the victim's status to "danger"
  victim.status = "danger";
  await victim.save();

  return res.status(200).json({ message: "Success", victim });
};

// Function to update victim's information
export const updateVictimInfo = async (req, res, next) => {
  // Extract new values from the request body
  const city = req.body.city.toLowerCase();
  const { name } = req.body;

  // Find the victim by ID
  const victim = await victimModel.findById(req.user._id);
  if (!victim) {
    return next(new Error("Victim not found", { cause: 404 }));
  }

  // Update the victim's information
  if (name) victim.name = name;
  if (city) victim.city = city;

  // Save the updated victim
  await victim.save();

  // Return a success response
  return res
    .status(200)
    .json({ message: "Victim information updated successfully", victim });
};

// Function to update the password of a victim
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

  // Find the victim by ID from the request user object
  const victim = await victimModel.findById(req.user._id);

  // Check if the old password matches the current password stored in the database
  const match = bcrypt.compareSync(oldPassword, victim.password);
  if (!match) {
    // If the old password does not match, return an error
    return next(new Error("Invalid old password", { cause: 404 }));
  }

  // Check if the new password is the same as the old password
  const matchOldNew = bcrypt.compareSync(newPassword, victim.password);
  if (matchOldNew) {
    // If the new password is the same as the old password, return an error
    return next(
      new Error("New password must be different from the old password", {
        cause: 409,
      })
    );
  }

  // Check if the new password has been used before
  const previousPasswords = victim.previousPasswords || [];
  const isPasswordUsedBefore = previousPasswords.some((hash) =>
    bcrypt.compareSync(newPassword, hash)
  );
  if (isPasswordUsedBefore) {
    return next(
      new Error(
        "New password must be different from previously used passwords",
        {
          cause: 409,
        }
      )
    );
  }

  // Hash the new password
  const hashNewPassword = bcrypt.hashSync(
    newPassword,
    parseInt(process.env.SALT_ROUND)
  );

  // Update the password and store the old password in the previousPasswords array
  previousPasswords.push(victim.password);

  victim.password = hashNewPassword;
  victim.previousPasswords = previousPasswords;
  await victim.save();

  // Return a success response
  return res
    .status(201)
    .json({ message: "The password has been updated successfully", victim });
};
