import Router from "express";
const router = Router();
import * as authController from "./controller/auth.controller.js";
import { asyncHandler } from "../../middleware/errorHandling.js";
import fileUpload, { fileValidation } from "../../services/multer.js";


router.post("/signUp", fileUpload(fileValidation.image).single("image"), asyncHandler(authController.signUp));
router.post("/signIn", asyncHandler(authController.signIn));
router.get("/confirmEmail/:token", asyncHandler(authController.confirmEmail));
router.patch("/sendCode", asyncHandler(authController.sendCode));
router.post("/forgetPassword", asyncHandler(authController.forgetPassword));

export default router;
