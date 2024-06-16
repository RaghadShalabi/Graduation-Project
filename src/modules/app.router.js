import connectDB from "../../DB/connection.js";
import { globalErrorHandler } from "../middleware/errorHandling.js";
import authRouter from "./auth/auth.router.js";
import victimRouter from "./victim/victim.router.js";
import rescueTeamRouter from "./rescueTeam/rescueTeam.router.js";

import cors from "cors";

const initApp = async (app, express) => {
    connectDB();
    app.use(cors());
    app.use(express.json());

    app.get("/", (req, res) => {
        return res.status(200).json("Welcome...");
    });

    //Routes
    app.use("/auth", authRouter);
    app.use("/victim", victimRouter);
    app.use("/rescueTeam", rescueTeamRouter);

    app.use(globalErrorHandler);

    app.get("*", (req, res) => {
        return res.status(500).json({ message: "Page not found 404 x_x" });
    });
    app.use(globalErrorHandler);
};
export default initApp;
