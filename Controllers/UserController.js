const User = require('../Models/User');
const Account = require('../Models/Account');
const { insertBvn, validateBvn, createAccount } = require('../services/nibssAdapter');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//fintech onoboarding
exports.registerUser = async (req, res) => {
    if(!req.body || Object.keys(req.body).length === 0){
        return res.status(400).json({ success: false, message: 'request body cannot be empty' });
    }

    try {
        const { firstName, lastName, email, phone, bvn, dob } = req.body;

        //validate inputs
        if(!firstName || !lastName || !email || !phone || !bvn || !dob || !req.body.password){
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        //check if email already exist
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if(existingEmail){
            return res.status(409).json({ success: false, message: 'email already exist' });
        }

        //check if bvn already exist
        const existingUser = await User.findOne({ bvn: bvn });
        if(existingUser){
            return res.status(409).json({ sucess: false, message: 'BVN already registered' });
        }

        //Insert BVN
        const bvnInsertResponse = await insertBvn({
            bvn,
            firstName,
            lastName,
            dob,
            phone
        });
        //if bnv already exist in nibss
        if(!bvnInsertResponse?.success){
            return res.status(409).json({
                success: false,
                message: bvnInsertResponse?.message ||
                'Unable to register BVN'
            });
        };

        //validate BVN
        const bvnValidationResponse = await validateBvn(bvn);
        if(!bvnValidationResponse?.success){
            return res.status(400).json({
                success: false,
                message: bvnValidationResponse.message ||
                'BVN validation failed'
            });
        };

        //create account with nibssApi
        const accountResponse = await createAccount({
            kycID: bvn,
            dob
        });

        if(!accountResponse?.account?.accountNumber){
            return res.status(400).json({ success: false, message: 'Unable to Create Account' });
        };


        //create/store the new user in my database
        const salt = await bcrypt.genSalt(2);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const user = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone,
            bvn,
            dob,
            password: hashedPassword,
            role: 'user'
        });

        await user.save();

        const account = new Account({
            user: user._id,
            bvn,
            accountNumber: accountResponse.account.accountNumber,
            accountName: accountResponse.account.accountName,
            balance: accountResponse.account.balance,
            bankCode: accountResponse.account.bankCode,
            bankName: accountResponse.account.bankName 
        });

        await account.save();

        res.status(201).json({                                            
            success: true,
            message: 'user created sucessfullly',
            data: {
                user: {
                    name: user.name,
                    email: user.email,  
                },
                account: {
                    accountNumber: accountResponse.account.accountNumber,
                    bankCode: accountResponse.account.bankCode,
                    bankName: accountResponse.account.bankName
                }
            }

        });

    } catch (error) {
        console.error('Registration Error:', {
            message: error.message,
            statusCode: error.statusCode,
            data: error.data,
            stack: error.stack
        });
        
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'User Registration Failed',
            data: error.data || null
        });
    }
};

exports.loginUser = async (req, res) => {

    try {
        const { email, password } = req.body

        if(!email || !password){
            return res.status(400).json({
                status: 'failed',
                message: 'Invalid email and password!'
            });
        }

        const user = await User.findOne({ email: email }).select('+password');

        if(!user){
            return res.status(401).json({
                message: 'Invalid email and password!'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(401).json({
                message: 'Invalid email and password!'
            });
        }

        const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});

        res.status(200).json({
            message: 'Login successful',
            token
        });

    } catch (error) {
        res.status(500).json({
            message: 'An error occurred',
            error: error.message
        });
    }
};
