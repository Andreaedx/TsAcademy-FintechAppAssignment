const mongoose = require('mongoose');
const Account = require('../Models/Account');
const Transaction = require('../Models/Transaction');
const { nameEnquiry, transferFunds } = require('../services/nibssAdapter');

exports.transfer = async (req, res) => {
    const session = await mongoose.startSession();

    try {

        const userId = req.user.id;

console.log('USER ID FROM JWT:', userId);

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

console.log('SENDER ACCOUNT:', senderAccount);
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
        let enquiry;
        try {
            const enquiry = await nameEnquiry(to);
            if(!enquiry || enquiry.status !== 'success'){
                return res.status(404).json({
                    status: 'error',
                    message: 'Invalid destination account'
                });
            }

        } catch (error) {
            throw new Error('Internal Error');
        }

        const accountName = enquiry?.accountName;

        //call transfer api
        const transferResponse = await transferFunds({
            from: senderAccount.accountNumber,
            to,
            amount,
            reference
        });

        if(!transferResponse || transferResponse.status !== 'SUCCESS'){
            throw new Error('Transfer Failed');
        }

        //Debit sender
        senderAccount.balance -= amount;
        await senderAccount.save({session});

        await Transaction.create({
            user: userId,
            fromAccount: senderAccount.accountNumber,
            toAccount: to,
            amount,
            type: 'debit',
            status: 'success',
            providerReference: transferResponse.transactionId
        }, {session});

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