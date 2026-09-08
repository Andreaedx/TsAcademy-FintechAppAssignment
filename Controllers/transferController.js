const mongoose = require('mongoose');
const Account = require('../Models/Account');
const Transaction = require('../Models/Transaction');
const { nameEnquiry, transferFunds } = require('../services/nibssAdapter');
const crypto = require('crypto');

exports.transfer = async (req, res) => {
    const session = await mongoose.startSession();

    try {

        const userId = req.user.id;
        
        // console.log('USER ID FROM JWT:', userId);

        const { to, amount } = req.body;

        //validate amount
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid transfer amount'
            });
        }

        //validate destination account
        if (!to) {
            return res.status(400).json({
                status: 'error',
                message: 'Destination account is required'
            });
        }

        session.startTransaction();

        //Get sender account
        const senderAccount = await Account.findOne({ user: userId }).session(session);
        
        //prevent transfering to own account
        if (senderAccount.accountNumber === to) {
            throw new Error('You cannot transfer to your own account');
        }


        if (!senderAccount) {
            throw new Error('Sender account not found');
        }

        //validate balance
        if(senderAccount.balance < amount){
            return res.status(400).json({
                status: 'error',
                message: 'Insufficient balance'
            });
        };

        //nameEnquiry
        const enquiry = await nameEnquiry(to);
        if (!enquiry || !enquiry.accountNumber || String(enquiry.accountNumber) !== String(to)) {
            return res.status(404).json({
                status: 'error',
                message: 'Invalid destination account'
            });
        }


        const accountName = enquiry?.accountName;

        //generate unique reference
        // const reference = `TRX-${Date.now()}`;
        const reference = crypto.randomInt(
            100000000000,
            1000000000000
        ).toString();

        //call transfer api
        const transferResponse = await transferFunds({
            from: senderAccount.accountNumber,
            to,
            amount
        });
        if (!transferResponse || !transferResponse.success) {
            throw new Error('Transfer Failed');
        }


        //Debit sender
        senderAccount.balance -= amount;
        await senderAccount.save({session});
        
        const transaction = await Transaction.create(
            [{
                user: req.user.id,
                fromAccount: senderAccount.accountNumber,
                toAccount: to,
                beneficiaryName: enquiry.accountName,
                amount: amount,
                type: 'debit',
                status: 'success',
                reference: reference,
                providerReference: transferResponse.providerReference,
                currency: 'NGN',
                // narration: narration,
                completedAt: new Date()
            }],{ session }
        );


        await session.commitTransaction();

        res.status(200).json({
            status: 'success',
            message: 'Transfer successful',
            data: {
                to,
                accountName,
                amount,
                reference: transferResponse.reference
            }
        });

    } catch (error) {
        if(session.inTransaction()){
            await session.abortTransaction();
        }

        res.status(500).json({
            status: 'error',
            message: error.message || 'Transfer failed'
        });
    } finally {
        session.endSession();
    }
};

exports.getTransactionByReference = async (req, res) => {
    try {
        const userId = req.user.id;

        const { reference } = req.params;

        if(!reference){
            return res.status(400).json({
                status: 'failed',
                message: 'Invalid'
            });
        }

        const transaction = await Transaction.findOne({
            providerReference: reference,
            user: userId
        });

        if(!transaction){
            return res.status(404).json({
                status: 'error',
                message: 'Transaction not found'
            });
        }

        return res.status(200).json({
            status: 'success',
            transaction
        });

    } catch(error) {
        console.error('TRANSACTION ERROR:', error);

        return res.status(500).json({
            status: error,
            message: 'Internal Error'
        });
    }
};