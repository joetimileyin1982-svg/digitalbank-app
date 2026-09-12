const express = require('express');
const router = express.Router();
const { verifyToken } = require('../Middleware/auth.js');
const { authorizeRoles } = require('../Middleware/roles.js');
const controllers = require('../controllers/accountcontroller');

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Bank account and transaction operations
 */

/**
 * @swagger
 * /accounts/create-account:
 *   post:
 *     summary: Create a bank account (requires verified KYC)
 *     tags: [Accounts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Account created successfully }
 *       400: { description: KYC not verified or account already exists }
 */
router.post('/create-account', verifyToken, controllers.createAccount);

/**
 * @swagger
 * /accounts/transfer:
 *   post:
 *     summary: Transfer funds to another account
 *     tags: [Accounts]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverAccountNumber, amount]
 *             properties:
 *               receiverAccountNumber: { type: string }
 *               amount: { type: number }
 *               narration: { type: string }
 *               pin: { type: string, description: "Required only if a transaction PIN has been set" }
 *     responses:
 *       200: { description: Transfer initiated successfully }
 *       400: { description: Insufficient balance or invalid input }
 *       401: { description: Invalid transaction PIN }
 */
router.post('/transfer', verifyToken, controllers.makeTransfer);

/**
 * @swagger
 * /accounts/balance:
 *   get:
 *     summary: Get the current account balance (live from NIBSS)
 *     tags: [Accounts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Balance retrieved successfully }
 *       404: { description: Account not found }
 */
router.get('/balance', verifyToken, controllers.getAccountBalance);

/**
 * @swagger
 * /accounts/transaction-status/{nibssTransactionId}:
 *   get:
 *     summary: Check the status of a transaction
 *     tags: [Accounts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: nibssTransactionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Transaction status retrieved }
 *       403: { description: Not authorized to view this transaction }
 *       404: { description: Transaction not found }
 */
router.get('/transaction-status/:nibssTransactionId', verifyToken, controllers.getTransactionStatus);

/**
 * @swagger
 * /accounts/transaction-history:
 *   get:
 *     summary: Get the logged-in user's own transaction history
 *     tags: [Accounts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Transaction history retrieved }
 */
router.get('/transaction-history', verifyToken, controllers.getTransactionHistory);

/**
 * @swagger
 * /accounts/name-enquiry/{accountNumber}:
 *   get:
 *     summary: Resolve an account number to the holder's name
 *     tags: [Accounts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Name enquiry successful }
 */
router.get('/name-enquiry/:accountNumber', verifyToken, controllers.getNameEnquiry);

/**
 * @swagger
 * /accounts/all-accounts:
 *   get:
 *     summary: Admin-only - list all accounts
 *     tags: [Accounts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: All accounts retrieved }
 *       403: { description: Forbidden - admin role required }
 */
router.get('/all-accounts', verifyToken, authorizeRoles('admin'), controllers.getAllAccountsAdmin);

module.exports = router;
