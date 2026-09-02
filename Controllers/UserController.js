const User = require('../Models/User');
const Account = require('../Models/Account');
const { insertBvn, validateBvn, createAccount } = require('../services/nibssAdapter');
const bcrypt = require('bcrypt');

//fintech onoboarding
exports.registerUser = async (req, res) => {
    if(!req.body || Object.keys(req.body).length === 0){
        return res.status(400).json({ success: false, message: 'request body cannot be empty' });
    }

    try {
        const { name, email, phone, bvn, dob } = req.body;

        //validate inputs
        if(!name || !email || !phone || !bvn || !dob || !req.body.password){
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // name = name.trim();
        // email = email.trim();
        // phone = phone.trim();
        // bvn = bvn.trim();
        // dob = dob.trim();

        //check if email already exist
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if(existingEmail){
            return res.status(409).json({ success: false, message: 'email already exist' });
        }

        //check if bvn already exist
        const existingUser = await User.findOne({ bvn: bvn });
        if(existingUser?.accountNumber){
            return res.status(409).json({ sucess: false, message: 'BVN already registered' });
        }

        const firstName = name.split(' ')[0];
        const lastName =  name.includes(' ') ? name.split(' ').splice(1).join(' ') : name;

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
            kycID,
            dob
        });
        if(!accountResponse?.accountNumber){
            return res.status(409).json({ success: false, message: 'Unable to Create Account' });
        };


        //create/store the new user in my database
        const salt = await bcrypt.genSalt(2);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const user = new User({
            name,
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
            accountNumber: accountResponse.accountNumber,
            bankCode: accountResponse.bankCode,
            bankName: accountResponse.bankName 
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
                    accountNumber: accountResponse.accountNumber,
                    bankCode: accountResponse.bankCode,
                    bankName: accountResponse.bankName
                }
            }

        });

    } catch (error) {
        console.error('Registration Error:', error);

        res.status(500).json({ sucess: false, message: 'user not created', error: error.message || 'User Registration Failed' });
    }
}

exports.createAccountWithBvn = async (req, res) => {
    if(!req.body || Object.keys(req.body).length === 0){
        return res.status(400).json({
            message: 'request body cannot be empty'
        });
    };

    try {
        if(!req.body.kycID || !req.body.dob){
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const bvnValidationResponse = await validateBvn(bvn);
        if(!bvnValidationResponse?.success){
            return res.status(409).json({
                message: 'Unable to validate BVN'
            });
        }

        const createAccountResponse = await createAccount({
            kycID: bvn,   
            dob
        });

        if(!createAccountResponse?.success){
            return res.status(409).json({
                message: 'Unable to createAccount'
            });
        }

        


    } catch (error) {

    }
}