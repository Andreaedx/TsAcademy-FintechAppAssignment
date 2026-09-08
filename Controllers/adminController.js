const { getAllAccounts } = require('../services/nibssAdapter')

exports.allAccounts = async (req, res) => {

    try {

        const accounts = await getAllAccounts();

        res.status(200).json({
            status: 'success',
            message: 'Accounts retrieved successfully',
            data: accounts
        });

    } catch (error) {

        res.status(500).json({
            status: 'failed',
            message: 'An error occurred',
            error: error.message
        });

    }
};
