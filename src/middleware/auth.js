import jwt from "jsonwebtoken";
import victimModel from "../../DB/victim.model.js";
import rescueTeamsModel from "../../DB/rescueTeam.model.js";

// Define the roles available in the system
export const roles = {
  Victim: "Victim",
  RescueTeam: "RescueTeam",
  SuperAdmin: "SuperAdmin",
};

// Authentication middleware to check if the user is authorized
export const auth = (accessRoles = []) => {
  return async (req, res, next) => {
    const { authorization } = req.headers; // Get the authorization header

    // Check if the authorization header is valid
    if (!authorization?.startsWith(process.env.BEARER_TOKEN)) {
      return res.status(409).json({ message: "Invalid authorization" });
    }

    // Extract the token from the authorization header
    const token = authorization.split(process.env.BEARER_TOKEN)[1];

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.SIGN_IN_SECRET_KEY);

    if (!decodedToken) {
      return res.status(400).json({ message: "Invalid authorization" });
    }

    let user;

    // Fetch the user based on the role in the decoded token
    if (decodedToken.role === "Victim") {
      user = await victimModel
        .findById({ _id: decodedToken.id })
        .select("name role changePasswordTime");
    } else if (decodedToken.role === "RescueTeam") {
      user = await rescueTeamsModel
        .findById({ _id: decodedToken.id })
        .select("name role changePasswordTime");
    } else if (decodedToken.role === "SuperAdmin") {
      user = await rescueTeamsModel
        .findById({ _id: decodedToken.id })
        .select("name role changePasswordTime");
    }

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User registered not found" });
    }

    // Check if the user has changed the password after the token was issued
    if (
      parseInt(user.changePasswordTime?.getTime() / 1000) > decodedToken.iat
    ) {
      return next(
        new Error("User changed password, please login", { cause: 400 })
      );
    }

    // Check if the user has the necessary role to access the route
    if (!accessRoles.includes(user.role)) {
      return res
        .status(403)
        .json({ message: "not authorization to this user" });
    }

    // Attach the user to the request object
    req.user = user;

    // Call the next middleware or route handler
    next();
  };
};
