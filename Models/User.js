const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    phone: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    bvn: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    dob: {
        type: Date,
        required: true
    },
    role: {
        type: String,
        enum: ['user'],
        default: 'user'
    }
},

{timestamps: true}

);

const User = mongoose.model('User', userSchema);

module.exports = User;