import victimModel from "../../../../DB/victim.model.js";
import sendEmail from "../../../services/sendEmail.js";
import bcrypt from 'bcryptjs'


export const setEmergencyContacts = async (req, res, next) => {
    const userId = req.user._id; // ID of the victim from the authenticated user
    const { contactsEmail } = req.body; // New emergency contacts from request body

    // Append new emergency contacts only if they do not already exist in the array
    const victim = await victimModel.findByIdAndUpdate(
        userId,
        { $addToSet: { contactsEmail: { $each: contactsEmail } } }, // Use $addToSet with $each to add only unique emails
        { new: true } // Return the updated document
    );

    if (!victim) {
        return next(new Error('Victim not found', { cause: 404 }));
    }

    // Respond with success and the updated document
    res.status(200).json({ message: 'Emergency contacts updated successfully.', victim });
};

//Set an email to all emergency contacts
export const setEmergencyMessage = async (req, res) => {
    const userId = req.user._id; // Assuming you have user authentication that sets req.user
    const { message } = req.body; // Get the emergency message from the request body

    // Find the victim by ID and update the message
    const victim = await victimModel.findByIdAndUpdate(
        userId,
        { $set: { message: message } },
        { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!victim) {
        return next(new Error('Victim not found', { cause: 404 }));
    }

    // Respond with success and the updated victim data
    res.status(200).json({
        message: 'Emergency message updated successfully.',
        victim: victim
    });
};

export const setHeartAndLocation = async (req, res) => {
    const userId = req.user._id; // Assuming user ID is stored in req.user
    const { heartRate, location } = req.body; // Data from the frontend
    const victim = await victimModel.findByIdAndUpdate(
        userId,
        { heartRate, location },
        { new: true } // Return the updated document
    );

    if (!victim) {
        return next(new Error('Victim not found', { cause: 404 }));
    }
    // Respond with success and the updated victim document
    res.status(200).json({ message: 'Heart rate and location updated successfully.', victim });
};

export const sendSOSMessage = async (req, res) => {
    const userId = req.user._id; // User ID from authenticated user
    const victim = await victimModel.findById(userId); // Retrieve the victim's details

    if (!victim) {
        return next(new Error('Victim not found', { cause: 404 }));
    }

    // Retrieve contacts and message from the victim's document
    const { contactsEmail, message } = victim;

    if (contactsEmail.length === 0) {
        return next(new Error('No contacts to send to', { cause: 400 }));
    }

    // Sending email to each contact
    contactsEmail.forEach(async (email) => {
        await sendEmail(email, 'SOS - Urgent', message);
    });

    victim.sosStatus = true;
    await victim.save();
    res.status(200).json({ message: 'SOS message sent to all emergency contacts.', victim });
};


// Function to update victim's information
export const updateVictimInfo = async (req, res, next) => {
    // Extract new values from the request body
    const { name, city } = req.body;

    // Find the victim by ID
    const victim = await victimModel.findById(req.user._id);
    if (!victim) {
        return next(new Error('Victim not found', { cause: 404 }));
    }

    // Update the victim's information
    if (name) victim.name = name;
    if (city) victim.city = city;

    // Save the updated victim
    await victim.save();

    // Return a success response
    return res.status(200).json({ message: "Victim information updated successfully", victim });
};


// Function to update the password of a victim
export const updatePassword = async (req, res, next) => {
    // Extract old and new passwords from the request body
    const { oldPassword, newPassword, cNewPassword } = req.body;

    // Check if newPassword matches cNewPassword
    if (newPassword !== cNewPassword) {
        return next(new Error('New password and confirm new password do not match', { cause: 400 }));
    }

    // Find the victim by ID from the request user object
    const victim = await victimModel.findById(req.user._id);

    // Check if the old password matches the current password stored in the database
    const match = bcrypt.compareSync(oldPassword, victim.password);
    if (!match) {
        // If the old password does not match, return an error
        return next(new Error('Invalid old password', { cause: 404 }));
    }

    // Check if the new password is the same as the old password
    const matchOldNew = bcrypt.compareSync(newPassword, victim.password);
    if (matchOldNew) {
        // If the new password is the same as the old password, return an error
        return next(new Error("New password must be different from the old password", { cause: 409 }));
    }

    // Check if the new password has been used before 
    const previousPasswords = victim.previousPasswords || [];
    const isPasswordUsedBefore = previousPasswords.some(hash => bcrypt.compareSync(newPassword, hash));
    if (isPasswordUsedBefore) {
        return next(new Error('New password must be different from previously used passwords', { cause: 409 }));
    }

    // Hash the new password
    const hashNewPassword = bcrypt.hashSync(newPassword, parseInt(process.env.SALT_ROUND));

    // Update the password and store the old password in the previousPasswords array
    previousPasswords.push(victim.password);
    await victimModel.updateOne(
        { _id: req.user._id },
        { password: hashNewPassword, previousPasswords }
    );

    // Return a success response
    return res.status(201).json({ message: "The password has been updated successfully", victim });
};
