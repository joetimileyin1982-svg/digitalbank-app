const express = require('express');
const router = express.Router();
const { verifyToken } = require('../Middleware/auth.js');
const { submitKyc } = require('../controllers/kyccontroller');

/**
 * @swagger
 * tags:
 *   name: KYC
 *   description: Identity verification via BVN/NIN
 */

/**
 * @swagger
 * /kyc/submit-kyc:
 *   post:
 *     summary: Submit BVN or NIN for identity verification
 *     tags: [KYC]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, dob]
 *             properties:
 *               bvn: { type: string, description: "Provide either bvn or nin" }
 *               nin: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               dob: { type: string, example: "2005-04-04" }
 *               phone: { type: string, description: "Required only if using bvn" }
 *     responses:
 *       200: { description: KYC verified or rejected }
 *       400: { description: Validation error or already verified }
 */
router.post('/submit-kyc', verifyToken, submitKyc);

module.exports = router;
