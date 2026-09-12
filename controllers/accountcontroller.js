const Kyc = require('../Models/KYC');
const Account = require('../Models/Account');
const Transaction = require('../Models/Transaction');
const User = require('../Models/Users');
const {
  createNibssAccount,
  transfer,
  checkTransactionStatus,
  checkBalance,
  nameEnquiry,
} = require('../Services/nibssService');
const { sendEmail } = require('../Middleware/emailsender');
const bcrypt = require('bcryptjs');

const createAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const kyc = await Kyc.findOne({ userId });

    if (!kyc) {
      return res.status(400).json({ message: 'KYC record not found' });
    }

    if (kyc.verificationStatus !== 'Verified') {
      return res.status(400).json({ message: 'KYC has not been verified' });
    }

    const existingAccount = await Account.findOne({ userId });

    if (existingAccount) {
      return res
        .status(400)
        .json({ message: 'Account already exists for this user' });
    }

    let kycType, kycID;

    if (kyc.bvn) {
      kycType = 'bvn';
      kycID = kyc.bvn;
    } else {
      kycType = 'nin';
      kycID = kyc.nin;
    }

    const nibssResponse = await createNibssAccount(kycType, kycID, kyc.dob);

    const newAccount = new Account({
      userId: userId,
      accountNumber: nibssResponse.account.accountNumber,
      bankCode: nibssResponse.account.bankCode,
      bankName: nibssResponse.account.bankName,
      balance: nibssResponse.account.balance,
    });

    await newAccount.save();

    const user = await User.findById(userId);
    const adminSubject = 'New Bank Account Created';
    const adminMessage = `A new account was created.\n\nCustomer: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nPhone: ${user.phone}\n\nAccount Number: ${newAccount.accountNumber}\nBank Code: ${newAccount.bankCode}\nBank Name: ${newAccount.bankName}\nBalance: ${newAccount.balance}`;
    await sendEmail(process.env.ADMIN_EMAIL, adminSubject, adminMessage);
    return res.status(201).json({
      message: 'Account created successfully',
      account: newAccount,
    });
  } catch (error) {
    console.error(
      'Error creating account:',
      error.response?.data || error.message,
    );
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getNameEnquiry = async (req, res) => {
  try {
    const { accountNumber } = req.params;

    if (typeof accountNumber !== 'string') {
      return res.status(400).json({ message: 'Invalid account number' });
    }

    const result = await nameEnquiry(accountNumber);

    return res.status(200).json({
      message: 'Name enquiry successful',
      result,
    });
  } catch (error) {
    console.error(
      'Error performing name enquiry:',
      error.response?.data || error.message,
    );
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const makeTransfer = async (req, res) => {
  try {
    const userId = req.user.id;

    const { receiverAccountNumber, amount, narration, pin } = req.body;

    if (typeof receiverAccountNumber !== 'string') {
      return res
        .status(400)
        .json({ message: 'Invalid receiver account number' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    if (narration !== undefined && typeof narration !== 'string') {
      return res.status(400).json({ message: 'Invalid narration' });
    }

    const senderAccount = await Account.findOne({ userId });

    if (!senderAccount) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const user = await User.findById(userId);

    if (user.transactionPin) {
      if (typeof pin !== 'string') {
        return res.status(400).json({ message: 'Transaction PIN is required' });
      }
      const isPinValid = await bcrypt.compare(pin, user.transactionPin);
      if (!isPinValid) {
        return res.status(401).json({ message: 'Invalid transaction PIN' });
      }
    }

    if (senderAccount.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const reference = `TXN-${Date.now()}`;

    const nibssResponse = await transfer(
      senderAccount.accountNumber,
      receiverAccountNumber,
      amount,
    );

    senderAccount.balance -= amount;
    await senderAccount.save();

    const receiverAccount = await Account.findOne({
      accountNumber: receiverAccountNumber,
    });
    if (receiverAccount) {
      receiverAccount.balance += amount;
      await receiverAccount.save();

      const receiverReference = `TXN-${Date.now()}-IN`;

      const receiverTransaction = new Transaction({
        accountId: receiverAccount._id,
        type: 'Deposit',
        amount,
        description: `Received from account ${senderAccount.accountNumber}`,
        reference: receiverReference,
        nibssTransactionId: nibssResponse.reference,
        status: 'SUCCESS',
      });

      await receiverTransaction.save();
    }

    const transaction = new Transaction({
      accountId: senderAccount._id,
      type: 'Transfer',
      amount,
      description: narration,
      reference,
      nibssTransactionId: nibssResponse.reference,
      status: 'PENDING',
    });

    await transaction.save();

    if (user.emailNotificationsEnabled) {
      const subject = 'Transfer Successful';
      const message = `Dear ${user.firstName} ${user.lastName},\n\nYou sent ₦${amount} to account ${receiverAccountNumber}.\n\nReference: ${reference}\n\nBest regards,\nThe Bank Team`;
      await sendEmail(user.email, subject, message);
    }

    return res.status(200).json({
      message: 'Transfer initiated successfully',
      transaction,
      nibssResponse,
    });
  } catch (error) {
    console.error(
      'Error making transfer:',
      error.response?.data || error.message,
    );
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getAccountBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const account = await Account.findOne({ userId });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const balance = await checkBalance(account.accountNumber);

    return res.status(200).json({
      message: 'Account balance retrieved successfully',
      balance,
    });
  } catch (error) {
    console.error(
      'Error checking balance:',
      error.response?.data || error.message,
    );
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getTransactionStatus = async (req, res) => {
  try {
    const { nibssTransactionId } = req.params;

    if (typeof nibssTransactionId !== 'string') {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    const nibssResponse = await checkTransactionStatus(nibssTransactionId);
    const transaction = await Transaction.findOne({ nibssTransactionId });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const account = await Account.findOne({
      _id: transaction.accountId,
      userId: req.user.id,
    });

    if (!account) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to access this transaction' });
    }

    if (nibssResponse.status) {
      transaction.status = nibssResponse.status;
      await transaction.save();
    }

    return res.status(200).json({
      message: 'Transaction status retrieved successfully',
      transaction,
      nibssResponse,
    });
  } catch (error) {
    console.error(
      'Error checking transaction status:',
      error.response?.data || error.message,
    );
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const account = await Account.findOne({ userId });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const transactions = await Transaction.find({
      accountId: account._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Transaction history retrieved successfully',
      transactions,
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllAccountsAdmin = async (req, res) => {
  try {
    const accounts = await Account.find().populate(
      'userId',
      'firstName lastName email',
    );

    return res.status(200).json({
      message: 'All accounts retrieved successfully',
      accounts,
    });
  } catch (error) {
    console.error('Error fetching all accounts:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createAccount,
  makeTransfer,
  getAccountBalance,
  getTransactionHistory,
  getNameEnquiry,
  getTransactionStatus,
  getAllAccountsAdmin,
};
