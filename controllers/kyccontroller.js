const Kyc = require('../Models/KYC');
const {
  insertBvn,
  insertNin,
  validateBvn,
  validateNin,
} = require('../Services/nibssService');
const { sendEmail } = require('../Middleware/emailsender');
const User = require('../Models/Users');

const submitKyc = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bvn, nin, firstName, lastName, dob, phone } = req.body;

    // typeof checks
    if (bvn !== undefined && typeof bvn !== 'string') {
      return res.status(400).json({ message: 'Invalid BVN' });
    }
    if (nin !== undefined && typeof nin !== 'string') {
      return res.status(400).json({ message: 'Invalid NIN' });
    }
    if (typeof firstName !== 'string' || typeof lastName !== 'string') {
      return res
        .status(400)
        .json({ message: 'First name and last name are required' });
    }
    if (!dob) {
      return res.status(400).json({ message: 'Date of birth is required' });
    }

    if (!bvn && !nin) {
      return res.status(400).json({ message: 'Either BVN or NIN is required' });
    }

    const existingKyc = await Kyc.findOne({ userId });
    if (existingKyc && existingKyc.verificationStatus === 'Verified') {
      return res.status(400).json({ message: 'KYC already verified' });
    }

    let verificationStatus = 'Rejected';
    let bvnVerified = false;
    let ninVerified = false;

    if (bvn) {
      if (typeof phone !== 'string') {
        return res.status(400).json({ message: 'Phone is required for BVN' });
      }
      await insertBvn(bvn, firstName, lastName, dob, phone);
      const validation = await validateBvn(bvn);
      if (validation.success) {
        verificationStatus = 'Verified';
        bvnVerified = true;
      }
    } else {
      await insertNin(nin, firstName, lastName, dob);
      const validation = await validateNin(nin);
      if (validation.response) {
        verificationStatus = 'Verified';
        ninVerified = true;
      }
    }

    const kyc = await Kyc.findOneAndUpdate(
      { userId },
      { userId, bvn, nin, dob, bvnVerified, ninVerified, verificationStatus },
      { upsert: true, new: true },
    );

    if (verificationStatus === 'Verified') {
      const user = await User.findById(userId);
      if (user.emailNotificationsEnabled) {
        const subject = 'KYC Verification Successful';
        const message = `Dear ${user.firstName} ${user.lastName},\n\nYour identity verification was successful. You can now proceed to create your bank account.\n\nBest regards,\nThe Bank Team`;
        await sendEmail(user.email, subject, message);
      }
    }

    return res.status(200).json({
      message: `KYC submission ${verificationStatus === 'Verified' ? 'verified' : 'rejected'}`,
      kyc,
    });
  } catch (error) {
    console.error(
      'Error submitting KYC:',
      error.response?.data || error.message,
    );
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { submitKyc };
