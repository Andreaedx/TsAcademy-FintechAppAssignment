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
            select: false
        },
        bvnStatus: {
            type: String,
            enum: ['PENDING', 'VERIFIED', 'FAILED'],
            default: 'PENDING'
        },
        nin: {
            type: String,
            select: false
        },
        ninStatus: {
            type: String,
            enum: ['PENDING', 'VERIFIED', 'FAILED'],
            default: 'PENDING'
        },
        status: {
            type: String,
            enum: [
                'PENDING',
                'PARTIALLY_VERIFIED',
                'VERIFIED',
                'FAILED',
                'REVIEW'
            ],
            default: 'PENDING'
        },

        ninVerifiedAt: Date,
        bvnVerifiedAt: Date
    },
    {
        timestamps: true
    }
);

const KYC = mongoose.model('KYC', kycSchema);
module.exports = KYC;
