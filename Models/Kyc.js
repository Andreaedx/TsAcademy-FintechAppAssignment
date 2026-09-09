const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        bvn: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },
        nin: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },
        bvnVerified: {
            type: Boolean,
            default: false
        },
        ninVerified: {
            type: Boolean,
            default: false
        },
        kycStatus: {
            type: String,
            enum: [
                'pending',
                'verified',
                'failed',
                'review'
            ],
            default: 'pending'
        },
        verifiedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

const KYC = mongoose.model("KYC", kycSchema);
module.exports = KYC;
