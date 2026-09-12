const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
  unique: true,        // ← add this
},
accountNumber: {
  type: String,
  required: true,
  unique: true,
},
bankCode: {             // ← add this
  type: String,
  required: true,
},
bankName: {              // ← add this
  type: String,
},

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: 'NGN',
    },

    status: {
      type: String,
      enum: ['Active', 'Frozen', 'Closed'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Account', accountSchema);