import express from "express";
import authController from "@/controllers/auth.controller";
const authRoutes = express.Router();

// User signup with email and password
authRoutes.post('/signup', authController.signUp);

// User login with email and password
authRoutes.post('/login', authController.signIn);

// User signup with google
authRoutes.get('/auth-google-link', authController.signGoogleLink);
authRoutes.post('/signin-google', authController.signInGoogle);
authRoutes.post('/signup-google', authController.signUpGoogle);

// User login with email and password
authRoutes.post('/login-google', authController.signIn);

export default authRoutes;