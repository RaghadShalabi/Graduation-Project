import jwt from 'jsonwebtoken'
import victimModel from "../../DB/victim.model.js";
import rescueTeamsModel from "../../DB/rescueTeam.model.js";

export const roles = {
    Victim: "Victim",
    RescueTeam: "RescueTeam",
    Admin: "Admin",
};

export const auth = (accessRoles = []) => {
    return async (req, res, next) => {
        const { authorization } = req.headers;
        if (!authorization?.startsWith(process.env.BEARER_TOKEN)) {
            return res.status(409).json({ message: "Invalid authorization" });
        }
        const token = authorization.split(process.env.BEARER_TOKEN)[1];
        const decodedToken = jwt.verify(token, process.env.SIGN_IN_SECRET_KEY);

        if (!decodedToken) {
            return res.status(400).json({ message: "Invalid authorization" });
        }

        let user;
        if (decodedToken.role === "Victim") {
            user = await victimModel
                .findById({ _id: decodedToken.id })
                .select("name role changePasswordTime");
        } else if (decodedToken.role === "RescueTeam") {
            user = await rescueTeamsModel
                .findById({ _id: decodedToken.id })
                .select("name role changePasswordTime");
        }

        if (!user) {
            return res.status(404).json({ message: "User registered not found" });
        }

        if (
            parseInt(user.changePasswordTime?.getTime() / 1000) > decodedToken.iat
        ) {
            return next(
                new Error("User changed password, please login", { cause: 400 })
            );
        }

        if (!accessRoles.includes(user.role)) {
            return res
                .status(403)
                .json({ message: "not authorization to this user" });
        }
        req.user = user;

        next();
    };
};