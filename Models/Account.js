const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    accountNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    bankCode: {
        type: String,
        required: true,
        trim: true
    },
    bankName: {
        type: String,
        required: true,
        trim: true
    }
},

{timestamps: true}

);

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;