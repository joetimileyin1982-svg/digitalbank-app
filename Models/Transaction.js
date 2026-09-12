const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },

    type: {
      type: String,
      enum: ['Deposit', 'Withdrawal', 'Transfer'],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
    },

    reference: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'Pending',
    },

    recipientAccountId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Account',  
},
recipientAccountNumber: {
  type: String,      
},
recipientBankCode: {
  type: String,       
},
nibssTransactionId: {
  type: String,
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);