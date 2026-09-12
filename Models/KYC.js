const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    bvn: {
      type: String,
      unique: true,
      sparse: true,
    },

    nin: {
      type: String,
      unique: true,
      sparse: true,
    },
    
    dob: {
  type: Date,
  required: true,
},

    bvnVerified: {
      type: Boolean,
      default: false,
    },

    ninVerified: {
      type: Boolean,
      default: false,
    },

    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Kyc', kycSchema);