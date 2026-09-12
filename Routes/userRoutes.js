const express = require('express');
const router = express.Router();
const Controller = require('../controllers/usercontroller.js');
const { loginLimiter } = require('../Middleware/rateLimitter');
const { verifyToken } = require('../Middleware/auth.js');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User authentication and account settings
 */

/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, phone]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201: { description: User created successfully }
 *       400: { description: Validation error }
 */
router.post('/signup', Controller.createUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Log in and receive a JWT
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful, returns JWT token }
 *       400: { description: Invalid credentials }
 */
router.post('/login', loginLimiter, Controller.loginUser);

/**
 * @swagger
 * /users/notifications:
 *   patch:
 *     summary: Toggle email notification preference
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emailNotificationsEnabled]
 *             properties:
 *               emailNotificationsEnabled: { type: boolean }
 *     responses:
 *       200: { description: Preference updated }
 */
router.patch('/notifications', verifyToken, Controller.updateEmailPreference);

/**
 * @swagger
 * /users/set-pin:
 *   patch:
 *     summary: Set a 4-digit transaction PIN
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin]
 *             properties:
 *               pin: { type: string, example: "1234" }
 *     responses:
 *       200: { description: PIN set successfully }
 */
router.patch('/set-pin', verifyToken, Controller.setTransactionPin);

module.exports = router;
