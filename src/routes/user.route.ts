import express from "express";
import userController from "@/controllers/user.controller";
import authenticate from "@/middlewares/authMiddleware";
const userRoutes = express.Router();

// User profile
userRoutes.get('/', authenticate, userController.getProfile);
userRoutes.put('/', authenticate, userController.editProfile);

export default userRoutes;