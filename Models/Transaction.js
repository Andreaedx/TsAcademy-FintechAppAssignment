const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        fromAccount: {
            type: String,
            required: true,
            index: true
        },
        toAccount: {
            type: String,
            required: true
        },
        beneficiaryName: {
            type: String,
            trim: true
        },
        amount: {
            type: Number,
            required: true,
            min: 1
        },
        currency: {
            type: String,
            default: 'NGN',
            uppercase: true
        },
        type: {
            type: String,
            enum: ['debit', 'credit'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'success', 'failed'],
            default: 'pending',
            index: true
        },
        reference: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        providerReference: {
            type: String,
            index: true
        },
        narration: {
            type: String,
            trim: true,
            maxlength: 200
        },
        failureReason: {
            type: String,
            trim: true
        },
        completedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
