import express from "express";
import authController from "@/controllers/auth.controller";
const authRoutes = express.Router();

// User signup with email and password
authRoutes.post('/signup', authController.signUp);

// User login with email and password
authRoutes.post('/login', authController.signIn);

export default authRoutes;