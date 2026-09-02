const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    bvn: {
        type: String,
        required: true,
        trim: true
    },
    accountNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    accountName: {
        type: String,
        required: true,
        trim: true
    },
    balance: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'NGN'
    },
    bankCode: {
        type: String,
        required: true,
        trim: true
    },
},

{timestamps: true}

);

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;